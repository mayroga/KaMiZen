from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import time
import uuid

app = FastAPI()

# =========================
# STATIC FILES
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# LOAD GAME CONTENT
# =========================
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    CONTENT = json.load(f)["missions"]

# =========================
# GLOBAL STATE
# =========================
SESSIONS = {}
RANKING = {}  # global ranking (simple memory)

# =========================
# XP SYSTEM
# =========================
def add_xp(session, amount):
    session["xp"] += amount
    if session["xp"] < 0:
        session["xp"] = 0

# =========================
# ACHIEVEMENTS
# =========================
def check_achievements(session):
    xp = session["xp"]
    achievements = session["achievements"]

    if xp >= 50 and "FIRST_CONTROL" not in achievements:
        achievements.append("FIRST_CONTROL")

    if xp >= 120 and "DISCIPLINE_LEVEL" not in achievements:
        achievements.append("DISCIPLINE_LEVEL")

    if session["errors"] == 0 and session["steps"] >= 5:
        if "PERFECT_RUN" not in achievements:
            achievements.append("PERFECT_RUN")

# =========================
# SESSION MODEL
# =========================
class StartRequest(BaseModel):
    profile: dict

class JudgeRequest(BaseModel):
    session_id: str
    decision: str


# =========================
# START GAME
# =========================
@app.post("/start")
def start(req: StartRequest):

    sid = str(uuid.uuid4())

    SESSIONS[sid] = {
        "index": 0,
        "xp": 0,
        "errors": 0,
        "steps": 0,
        "achievements": [],
        "started_at": time.time(),
        "lang": req.profile.get("lang", "en"),
        "timer": 30
    }

    mission = CONTENT[0]

    return {
        "session_id": sid,
        "story": build_story(mission, 0, SESSIONS[sid])
    }


# =========================
# JUDGE ANSWERS
# =========================
@app.post("/judge")
def judge(req: JudgeRequest):

    if req.session_id not in SESSIONS:
        return JSONResponse({"error": "invalid session"}, status_code=400)

    session = SESSIONS[req.session_id]
    mission = CONTENT[session["index"]]

    session["steps"] += 1

    correct = is_correct(mission, req.decision)

    # =========================
    # XP LOGIC FIXED
    # =========================
    if correct:
        add_xp(session, 10)
        result_type = "success"
    else:
        add_xp(session, -5)
        session["errors"] += 1
        result_type = "fail"

    # =========================
    # GAME OVER RULE (soft, no reset spam)
    # =========================
    if session["errors"] >= 3:
        session["status"] = "mental_break"
        return {
            "session_id": req.session_id,
            "story": {
                "type": "fail",
                "text_es": "Demasiados errores. Respira y reinicia enfoque mental."
            }
        }

    # =========================
    # NEXT LEVEL
    # =========================
    session["index"] += 1

    if session["index"] >= len(CONTENT):
        update_ranking(session)
        return {
            "session_id": req.session_id,
            "story": {
                "type": "end",
                "text_es": "Has completado el entrenamiento. Eres más fuerte mentalmente."
            }
        }

    next_mission = CONTENT[session["index"]]

    check_achievements(session)

    return {
        "session_id": req.session_id,
        "result": result_type,
        "xp": session["xp"],
        "achievements": session["achievements"],
        "story": build_story(next_mission, session["index"], session)
    }


# =========================
# BUILD STORY RESPONSE
# =========================
def build_story(mission, index, session):

    block = mission["blocks"][0]

    return {
        "type": "mission",
        "level": mission["level"],
        "xp": session["xp"],
        "timer": session["timer"],
        "text_es": block["text"]["es"] if "text" in block else "",
        "options": extract_options(mission)
    }


# =========================
# EXTRACT OPTIONS
# =========================
def extract_options(mission):

    for b in mission["blocks"]:
        if b["type"] in ["quiz", "tvid"]:
            opts = []

            for o in b["options"]:
                opts.append({
                    "code": o.get("code", o["text"]["es"]),
                    "text": o["text"],
                    "correct": o.get("correct", False)
                })

            return opts

    return []


# =========================
# CHECK ANSWER
# =========================
def is_correct(mission, decision):

    for b in mission["blocks"]:
        if b["type"] in ["quiz", "tvid"]:
            for o in b["options"]:
                if o.get("code", o["text"]["es"]) == decision:
                    return o.get("correct", False)

    return False


# =========================
# RANKING SYSTEM
# =========================
def update_ranking(session):

    score = session["xp"]
    user_id = str(uuid.uuid4())

    RANKING[user_id] = score


@app.get("/ranking")
def get_ranking():

    sorted_rank = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)

    return {
        "ranking": [
            {"player": k, "xp": v}
            for k, v in sorted_rank[:10]
        ]
    }


# =========================
# STATIC FRONTEND
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")
