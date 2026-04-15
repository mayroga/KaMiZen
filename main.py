from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os
import time
import random

app = FastAPI()

# =========================
# STATIC
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
CONTENT_PATH = os.path.join(STATIC_DIR, "kamizen_content.json")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# =========================
# LOAD CONTENT
# =========================
def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("missions", [])
    except:
        return []

MISSIONS = load_content()


# =========================
# MEMORY
# =========================
sessions = {}
ranking = {}


# =========================
# HELPERS
# =========================
def get_mission(index):
    if 0 <= index < len(MISSIONS):
        return MISSIONS[index]
    return None


def get_first_block(mission):
    if mission and mission.get("blocks"):
        return mission["blocks"][0]
    return None


def clamp(v):
    return max(0, min(100, v))


def get_blocks(mission):
    if not mission:
        return []
    blocks = mission.get("blocks", [])
    return blocks


# =========================
# COACH SYSTEM
# =========================
COACH = {
    "start": ["Focus", "Observe", "Breathe", "Attention active"],
    "correct": ["Good", "Correct", "Well done", "Excellent"],
    "wrong": ["Try again", "Learn", "Adjust", "Refocus"]
}


def coach(mode):
    return random.choice(COACH.get(mode, COACH["start"]))


# =========================
# ACTION LOCK
# =========================
def can_act(session):
    now = time.time()
    if now - session["last_action"] < 0.8:
        return False
    session["last_action"] = now
    return True


# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))


# =========================
# START SESSION
# =========================
@app.post("/start")
async def start(req: Request):

    sid = str(uuid.uuid4())

    mission = get_mission(0)

    sessions[sid] = {
        "mission_index": 0,
        "block_index": 0,
        "xp": 0,
        "streak": 0,

        # METRICS FASE 2
        "stress": 40,
        "attention": 50,
        "emotion": 50,

        "last_action": 0
    }

    return {
        "session_id": sid,
        "story": get_first_block(mission),
        "coach": coach("start"),
        "xp": 0
    }


# =========================
# JUDGE CORE (ORQUESTA)
# =========================
@app.post("/judge")
async def judge(req: Request):

    body = await req.json()
    sid = body.get("session_id")
    decision = body.get("decision")

    s = sessions.get(sid)

    if not s:
        return JSONResponse({"error": "Session expired"}, 401)

    if not can_act(s):
        return {
            "story": {
                "type": "wait",
                "text": {"en": "Wait...", "es": "Espera..."}
            },
            "xp": s["xp"]
        }

    mission = get_mission(s["mission_index"])
    if not mission:
        return {"story": {"type": "end", "text": {"en": "END", "es": "FIN"}}}

    blocks = mission.get("blocks", [])

    # =========================
    # BLOCK FLOW
    # =========================
    if s["block_index"] >= len(blocks):
        s["mission_index"] += 1
        s["block_index"] = 0
        mission = get_mission(s["mission_index"])
        blocks = mission.get("blocks", []) if mission else []

    if not mission or not blocks:
        return {"story": {"type": "end", "text": {"en": "END", "es": "FIN"}}}

    block = blocks[s["block_index"]]
    s["block_index"] += 1

    # =========================
    # TVID CHECK
    # =========================
    correct = True
    reason = {}

    if block.get("type") == "tvid":
        option = next(
            (o for o in block.get("options", [])
             if o.get("code") == decision),
            None
        )

        if option:
            correct = option.get("correct", False)
            reason = option.get("reason", {})

    # =========================
    # XP + METRICS
    # =========================
    if correct:
        s["xp"] += 10
        s["streak"] += 1
        s["attention"] += 2
        s["emotion"] += 1
        s["stress"] -= 2
        coach_msg = coach("correct")
        signal = "green"
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["streak"] = 0
        s["attention"] -= 2
        s["emotion"] -= 2
        s["stress"] += 3
        coach_msg = coach("wrong")
        signal = "red"

    # CLAMP
    s["stress"] = clamp(s["stress"])
    s["attention"] = clamp(s["attention"])
    s["emotion"] = clamp(s["emotion"])

    ranking[sid] = s["xp"]

    # =========================
    # NEXT BLOCK
    # =========================
    next_block = None
    next_mission = get_mission(s["mission_index"])

    if next_mission and s["block_index"] < len(next_mission["blocks"]):
        next_block = next_mission["blocks"][s["block_index"]]
    else:
        s["mission_index"] += 1
        s["block_index"] = 0
        next_mission = get_mission(s["mission_index"])
        next_block = get_first_block(next_mission)

    return {
        "story": next_block,
        "correct": correct,
        "reason": reason,
        "coach": coach_msg,

        # SEMÁFORO
        "signal": signal,

        # VOZ (FRONTEND)
        "voice": True,

        "xp": s["xp"],
        "streak": s["streak"],

        "metrics": {
            "stress": s["stress"],
            "attention": s["attention"],
            "emotion": s["emotion"]
        }
    }


# =========================
# FORCE SKIP
# =========================
@app.post("/force_skip")
async def force_skip(req: Request):

    body = await req.json()
    sid = body.get("session_id")

    s = sessions.get(sid)
    if not s:
        return JSONResponse({"error": "invalid session"}, 401)

    s["block_index"] += 1

    mission = get_mission(s["mission_index"])
    if not mission:
        return {"story": {"type": "end", "text": {"en": "END", "es": "FIN"}}}

    if s["block_index"] >= len(mission["blocks"]):
        s["mission_index"] += 1
        s["block_index"] = 0

    mission = get_mission(s["mission_index"])

    return {
        "story": get_first_block(mission),
        "xp": s["xp"]
    }


# =========================
# FORCE BACK
# =========================
@app.post("/force_back")
async def force_back(req: Request):

    body = await req.json()
    sid = body.get("session_id")

    s = sessions.get(sid)
    if not s:
        return JSONResponse({"error": "invalid session"}, 401)

    s["block_index"] = max(0, s["block_index"] - 1)

    mission = get_mission(s["mission_index"])
    if not mission:
        return {"story": {"type": "end", "text": {"en": "END", "es": "FIN"}}}

    return {
        "story": mission["blocks"][s["block_index"]],
        "xp": s["xp"]
    }


# =========================
# RANKING
# =========================
@app.get("/ranking")
def get_ranking():
    return sorted(ranking.items(), key=lambda x: x[1], reverse=True)[:10]


# =========================
# RELOAD
# =========================
@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "missions": len(MISSIONS)}


# =========================
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
