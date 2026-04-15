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
    except Exception:
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
def get_mission(i):
    if 0 <= i < len(MISSIONS):
        return MISSIONS[i]
    return None


def clamp(v):
    return max(0, min(100, v))


def get_first_valid_block(mission):
    if not mission or not mission.get("blocks"):
        return None
    return mission["blocks"][0]


# =========================
# SIMPLE COACH (NO RUIDO)
# =========================
COACH = {
    "start": ["Focus", "Observe", "Breathe"],
    "correct": ["Good", "Correct", "Well done"],
    "wrong": ["Try again", "Adjust", "Learn"]
}

def coach(mode):
    return random.choice(COACH.get(mode, COACH["start"]))


# =========================
# ACTION LOCK (ANTI FREEZE / ANTI DOUBLE CLICK)
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
# START
# =========================
@app.post("/start")
async def start(req: Request):

    sid = str(uuid.uuid4())

    sessions[sid] = {
        "mission_index": 0,
        "block_index": 0,
        "xp": 0,
        "streak": 0,

        # FASE 2 METRICS
        "stress": 40,
        "attention": 50,
        "emotion": 50,

        "last_action": 0
    }

    mission = get_mission(0)
    block = get_first_valid_block(mission)

    return {
        "session_id": sid,
        "story": block,
        "coach": coach("start"),
        "lang": "en"
    }


# =========================
# JUDGE (CONTROL ORQUESTADO)
# =========================
@app.post("/judge")
async def judge(req: Request):

    body = await req.json()
    sid = body.get("session_id")
    decision = body.get("decision")

    s = sessions.get(sid)
    if not s:
        return JSONResponse({"error": "Session expired"}, 401)

    # LOCK
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
    # CURRENT BLOCK
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
        opt = next(
            (o for o in block.get("options", [])
             if o.get("code") == decision),
            None
        )

        if opt:
            correct = opt.get("correct", False)
            reason = opt.get("reason", {})

    # =========================
    # UPDATE XP + METRICS
    # =========================
    if correct:
        s["xp"] += 10
        s["streak"] += 1
        s["attention"] += 2
        s["emotion"] += 1
        s["stress"] -= 2
        msg = coach("correct")
    else:
        s["xp"] = max(0, s["xp"] - 4)
        s["streak"] = 0
        s["attention"] -= 2
        s["emotion"] -= 2
        s["stress"] += 3
        msg = coach("wrong")

    # CLAMP SAFE
    s["stress"] = clamp(s["stress"])
    s["attention"] = clamp(s["attention"])
    s["emotion"] = clamp(s["emotion"])

    ranking[sid] = s["xp"]

    # =========================
    # NEXT BLOCK SAFE FLOW
    # =========================
    next_block = None

    if s["block_index"] < len(blocks):
        next_block = blocks[s["block_index"]]
    else:
        s["mission_index"] += 1
        s["block_index"] = 0
        nm = get_mission(s["mission_index"])
        next_block = get_first_valid_block(nm)

    return {
        "story": next_block,
        "correct": correct,
        "xp": s["xp"],
        "streak": s["streak"],
        "reason": reason,
        "coach": msg,
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
        return JSONResponse({"error": "Invalid session"}, 401)

    s["block_index"] += 1

    mission = get_mission(s["mission_index"])
    if not mission:
        return {"story": {"type": "end", "text": {"en": "END", "es": "FIN"}}}

    if s["block_index"] >= len(mission["blocks"]):
        s["mission_index"] += 1
        s["block_index"] = 0

    mission = get_mission(s["mission_index"])

    return {
        "story": get_first_valid_block(mission),
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
