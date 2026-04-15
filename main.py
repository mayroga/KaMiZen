from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os
import random
from typing import Any, Dict, List

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
GAME_DATA: List[Dict[str, Any]] = []
MISSION_IDS: List[int] = []
SESSIONS: Dict[str, Dict[str, Any]] = {}
RANKING: Dict[str, int] = {}

# =========================
# LOAD GAME
# =========================
def load_game():
    global GAME_DATA, MISSION_IDS

    try:
        if not os.path.exists(CONTENT_PATH):
            GAME_DATA, MISSION_IDS = [], []
            return

        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        missions = data.get("missions", [])
        clean = [m for m in missions if isinstance(m, dict) and "id" in m]

        clean.sort(key=lambda x: x.get("id", 0))

        GAME_DATA = clean
        MISSION_IDS = [m["id"] for m in clean]

        print(f"✅ Loaded missions: {len(GAME_DATA)}")

    except Exception as e:
        print("❌ LOAD ERROR:", e)
        GAME_DATA, MISSION_IDS = [], []

load_game()

# =========================
# UTILS
# =========================
def get_mission(mid):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)

def next_mission(current, visited):
    remaining = [m for m in MISSION_IDS if m not in visited]
    return random.choice(remaining) if remaining else MISSION_IDS[0]

def prev_mission(current):
    if current in MISSION_IDS:
        idx = MISSION_IDS.index(current)
        return MISSION_IDS[max(0, idx - 1)]
    return None

def norm(x):
    return str(x).strip().upper()

def get_tvid(mission):
    return next((b for b in mission.get("blocks", []) if b.get("type") == "tvid"), None)

# =========================
# ROOT
# =========================
@app.get("/")
def root():
    file = os.path.join(STATIC_DIR, "session.html")
    return FileResponse(file)

# =========================
# START SESSION
# =========================
@app.post("/start")
async def start(req: Request):
    sid = str(uuid.uuid4())

    SESSIONS[sid] = {
        "mission_id": MISSION_IDS[0] if MISSION_IDS else None,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "visited": [],
        "break_counter": 0,
        "engagement_mode": True,   # 🔥 MODE ACTIVADO
        "coach_mood": "neutral"
    }

    return {
        "session_id": sid,
        "mission": get_mission(SESSIONS[sid]["mission_id"])
    }

# =========================
# COACH PERSONALITY ENGINE
# =========================
def coach_message(s):
    if s["streak"] >= 3:
        return "🔥 Estás en racha. Sigue así."
    if s["errors"] >= 2:
        return "🧠 Respira. Ajusta tu enfoque."
    if s["xp"] > 80:
        return "⚡ Nivel alto. Control total requerido."
    return "🎯 Enfoque activo."

# =========================
# GET MISSION
# =========================
@app.post("/get_mission")
async def get_mission_route(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    mission = get_mission(s["mission_id"])

    return {
        "mission": mission,
        "coach": coach_message(s)
    }

# =========================
# JUDGE CORE (TVID + GAME LOOP)
# =========================
@app.post("/judge")
async def judge(req: Request):
    body = await req.json()

    sid = body.get("session_id")
    decision = body.get("decision")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    mission = get_mission(s["mission_id"])
    if not mission:
        return JSONResponse({"error": "No mission"}, 404)

    tvid = get_tvid(mission)

    # =========================
    # NO TVID → AUTO FLOW
    # =========================
    if not tvid:
        s["visited"].append(s["mission_id"])
        s["mission_id"] = next_mission(s["mission_id"], s["visited"])
        return {"auto": True, "next": get_mission(s["mission_id"])}

    option = next((o for o in tvid["options"] if norm(o["code"]) == norm(decision)), None)

    if not option:
        return JSONResponse({"error": "Invalid option"}, 400)

    correct = option.get("correct", False)

    # =========================
    # ENGAGEMENT REWARD SYSTEM
    # =========================
    if correct:
        base = 20
        bonus = s["streak"] * 5
        s["xp"] += base + bonus
        s["streak"] += 1
        s["errors"] = 0

        feedback = "🟢 PERFECTO"
    else:
        s["xp"] = max(0, s["xp"] - 10)
        s["errors"] += 1
        s["streak"] = 0

        feedback = "🔴 ERROR"

    # =========================
    # ADAPTIVE DIFFICULTY
    # =========================
    if s["errors"] >= 3:
        s["xp"] = max(0, s["xp"] - 5)
        s["errors"] = 0

    # =========================
    # BREAK SYSTEM
    # =========================
    s["break_counter"] += 1
    break_mode = False

    if s["break_counter"] >= 8:
        break_mode = True
        s["break_counter"] = 0

    # =========================
    # NEXT MISSION (ANTI PREDICT)
    # =========================
    s["visited"].append(s["mission_id"])
    s["mission_id"] = next_mission(s["mission_id"], s["visited"])

    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "feedback": feedback,
        "xp": s["xp"],
        "streak": s["streak"],
        "coach": coach_message(s),
        "reason": option.get("reason", {}),
        "next_mission": get_mission(s["mission_id"]),
        "break": break_mode
    }

# =========================
# FORCE NAVIGATION (CONTROLLED PENALTY)
# =========================
@app.post("/force_next")
async def force_next(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    s["xp"] = max(0, s["xp"] - 15)
    s["mission_id"] = next_mission(s["mission_id"], s["visited"])

    return {
        "message": "⚠ Saltar reduce tu progreso",
        "xp": s["xp"],
        "mission": get_mission(s["mission_id"])
    }

# =========================
# FORCE BACK
# =========================
@app.post("/force_back")
async def force_back(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    prev = prev_mission(s["mission_id"])

    if not prev:
        return {"message": "No puedes retroceder más"}

    s["xp"] = max(0, s["xp"] - 10)
    s["mission_id"] = prev

    return {
        "message": "⛔ Retroceso con costo",
        "xp": s["xp"],
        "mission": get_mission(prev)
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
