from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os
import random
import time

app = FastAPI()

# =========================
# PATH CONFIG
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
CONTENT_PATH = os.path.join(STATIC_DIR, "kamizen_content.json")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================
# MEMORY SYSTEM
# =========================
GAME_DATA = []
MISSION_IDS = []
SESSIONS = {}
RANKING = {}

# =========================
# LOAD GAME
# =========================
def load_game():
    global GAME_DATA, MISSION_IDS

    if not os.path.exists(CONTENT_PATH):
        GAME_DATA, MISSION_IDS = [], []
        return

    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    missions = data.get("missions", [])
    missions = [m for m in missions if isinstance(m, dict) and "id" in m]
    missions.sort(key=lambda x: x.get("id", 0))

    GAME_DATA = missions
    MISSION_IDS = [m["id"] for m in missions]

load_game()

# =========================
# UTILITIES
# =========================
def get_mission(mid):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)

def get_tvid(mission):
    return next((b for b in mission.get("blocks", []) if b.get("type") == "tvid"), None)

def normalize(x):
    return str(x).strip().upper()

def next_mission(current_id, visited):
    remaining = [m for m in MISSION_IDS if m not in visited]
    if not remaining:
        return MISSION_IDS[0] if MISSION_IDS else None
    return random.choice(remaining)

# =========================
# COACH ENGINE
# =========================
COACH = {
    "start": ["Focus active", "Observe", "Calm mind"],
    "correct": ["Good decision", "Correct", "Well done"],
    "wrong": ["Learn from this", "Adjust", "Try again"]
}

def coach(mode):
    return random.choice(COACH.get(mode, COACH["start"]))

# =========================
# SESSION LOCK SYSTEM (CRITICAL)
# =========================
def can_act(session):
    now = time.time()
    last = session.get("last_action", 0)

    # ❗ BLOQUEA spam o doble acción
    if now - last < 1.2:
        return False

    session["last_action"] = now
    return True

# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# =========================
# START SESSION
# =========================
@app.post("/start")
async def start(req: Request):

    sid = str(uuid.uuid4())

    SESSIONS[sid] = {
        "mission_id": MISSION_IDS[0] if MISSION_IDS else None,
        "xp": 0,
        "streak": 0,
        "errors": 0,
        "visited": [],
        "last_action": 0,

        # 🔥 NEW FASE 2 STATE
        "locked": False,
        "emotion_score": 0,
        "attention_score": 0,
        "stress_score": 0,
        "age_group": "adult"
    }

    return {
        "session_id": sid,
        "mission": get_mission(SESSIONS[sid]["mission_id"]),
        "coach": coach("start")
    }

# =========================
# GET MISSION (SAFE)
# =========================
@app.post("/get_mission")
async def get_mission_route(req: Request):

    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    return {
        "mission": get_mission(s["mission_id"]),
        "coach": coach("start")
    }

# =========================
# JUDGE (CONTROLLED FLOW ENGINE)
# =========================
@app.post("/judge")
async def judge(req: Request):

    body = await req.json()
    sid = body.get("session_id")
    decision = body.get("decision")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    # 🔥 LOCK CHECK (NO DOUBLE ACTIONS)
    if not can_act(s):
        return {
            "locked": True,
            "message": "Action too fast, wait",
            "xp": s["xp"]
        }

    mission = get_mission(s["mission_id"])
    if not mission:
        return JSONResponse({"error": "Mission missing"}, 404)

    tvid = get_tvid(mission)

    # =========================
    # NO TVID FLOW
    # =========================
    if not tvid:
        s["visited"].append(s["mission_id"])
        s["mission_id"] = next_mission(s["mission_id"], s["visited"])

        return {
            "auto": True,
            "correct": True,
            "xp": s["xp"],
            "next_mission": get_mission(s["mission_id"]),
            "coach": coach("start")
        }

    option = next(
        (o for o in tvid.get("options", [])
         if normalize(o.get("code")) == normalize(decision)),
        None
    )

    if not option:
        return JSONResponse({"error": "Invalid option"}, 400)

    correct = option.get("correct", False)

    # =========================
    # XP + EMOTION SYSTEM
    # =========================
    if correct:
        s["xp"] += 10
        s["streak"] += 1
        s["emotion_score"] += 2
        s["attention_score"] += 3
        s["stress_score"] -= 2
        coach_msg = coach("correct")
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["streak"] = 0
        s["emotion_score"] -= 2
        s["attention_score"] -= 1
        s["stress_score"] += 4
        coach_msg = coach("wrong")

    # =========================
    # CLAMP VALUES (NO OVERFLOW)
    # =========================
    s["stress_score"] = max(0, min(100, s["stress_score"]))
    s["attention_score"] = max(0, min(100, s["attention_score"]))
    s["emotion_score"] = max(0, min(100, s["emotion_score"]))

    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "streak": s["streak"],
        "reason": option.get("reason", {}),
        "coach": coach_msg,

        # 🔥 FASE 2 DATA STREAM
        "emotion": {
            "stress": s["stress_score"],
            "attention": s["attention_score"],
            "emotion": s["emotion_score"]
        },

        "next_mission": get_mission(s["mission_id"])
    }

# =========================
# FORCE NAVIGATION (SAFE)
# =========================
@app.post("/force_next")
async def force_next(req: Request):

    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    s["mission_id"] = next_mission(s["mission_id"], s["visited"])
    s["visited"].append(s["mission_id"])

    return {
        "mission": get_mission(s["mission_id"]),
        "xp": s["xp"]
    }

@app.post("/force_back")
async def force_back(req: Request):

    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    if len(s["visited"]) > 0:
        s["mission_id"] = s["visited"][-1]

    return {
        "mission": get_mission(s["mission_id"]),
        "xp": s["xp"]
    }

# =========================
# RANKING
# =========================
@app.get("/ranking")
def ranking():
    return sorted(RANKING.items(), key=lambda x: x[1], reverse=True)[:10]

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
