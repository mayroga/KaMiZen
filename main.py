from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os
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

        print(f"✅ Loaded: {len(GAME_DATA)} missions")

    except Exception as e:
        print("❌ LOAD ERROR:", e)
        GAME_DATA, MISSION_IDS = [], []

load_game()

# =========================
# UTILS
# =========================
def get_mission_by_id(mid):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)

def get_next_id(current_id, visited):
    for mid in MISSION_IDS:
        if mid not in visited:
            return mid
    return None  # FIN DEL JUEGO

def get_prev_id(current_id):
    if current_id not in MISSION_IDS:
        return None
    idx = MISSION_IDS.index(current_id)
    return MISSION_IDS[idx - 1] if idx > 0 else None

def normalize(x):
    return str(x).strip().upper()

def find_tvid(mission):
    return next((b for b in mission.get("blocks", []) if b.get("type") == "tvid"), None)

# =========================
# ROOT
# =========================
@app.get("/")
def root():
    file = os.path.join(STATIC_DIR, "session.html")
    return FileResponse(file) if os.path.exists(file) else JSONResponse({"error": "UI missing"})

# =========================
# START SESSION
# =========================
@app.post("/start")
async def start(req: Request):
    sid = str(uuid.uuid4())

    first = MISSION_IDS[0] if MISSION_IDS else None

    SESSIONS[sid] = {
        "mission_id": first,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "visited": [],
        "break_trigger": 0,
        "silence_mode": False
    }

    return {
        "session_id": sid,
        "mission": get_mission_by_id(first)
    }

# =========================
# GET MISSION
# =========================
@app.post("/get_mission")
async def get_mission(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, 401)

    s = SESSIONS[sid]
    mission = get_mission_by_id(s["mission_id"])

    # 🔥 DETECTAR SILENCIO
    silence = any(b.get("type") == "silence" for b in mission.get("blocks", []))

    silence_payload = None
    if silence:
        s["silence_mode"] = True
        silence_payload = {
            "active": True,
            "message": "🔇 Reto de silencio: controla tu mente sin hablar.",
            "objective": "Fortalecer autocontrol y enfoque.",
            "benefit": "Reduce ansiedad, mejora concentración."
        }
    else:
        s["silence_mode"] = False

    return {
        "mission": mission,
        "silence": silence_payload
    }

# =========================
# JUDGE
# =========================
@app.post("/judge")
async def judge(req: Request):
    body = await req.json()

    sid = body.get("session_id")
    decision = body.get("decision")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, 401)

    s = SESSIONS[sid]
    mission = get_mission_by_id(s["mission_id"])

    if not mission:
        return JSONResponse({"error": "Mission not found"}, 404)

    tvid = find_tvid(mission)

    if not tvid:
        s["visited"].append(s["mission_id"])
        s["mission_id"] = get_next_id(s["mission_id"], s["visited"])
        return {"auto": True}

    option = next(
        (o for o in tvid.get("options", []) if normalize(o.get("code")) == normalize(decision)),
        None
    )

    if not option:
        return JSONResponse({"error": "Invalid option"}, 404)

    correct = option.get("correct", False)

    if correct:
        s["xp"] += 20
        s["streak"] += 1
        s["visited"].append(s["mission_id"])
        s["mission_id"] = get_next_id(s["mission_id"], s["visited"])
        feedback = "🟢 CORRECTO"
    else:
        s["xp"] = max(0, s["xp"] - 10)
        s["errors"] += 1
        s["streak"] = 0
        feedback = "🔴 INCORRECTO"

    # BREAK
    s["break_trigger"] += 1
    break_mode = s["break_trigger"] >= 8

    if break_mode:
        s["break_trigger"] = 0

    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "feedback": feedback,
        "xp": s["xp"],
        "next_mission": get_mission_by_id(s["mission_id"]),
        "break": break_mode
    }

# =========================
# FORCE NEXT (CASTIGO)
# =========================
@app.post("/force_next")
async def force_next(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, 401)

    s = SESSIONS[sid]

    # 🔥 CASTIGO
    s["xp"] = max(0, s["xp"] - 15)

    s["visited"].append(s["mission_id"])
    s["mission_id"] = get_next_id(s["mission_id"], s["visited"])

    return {
        "penalty": True,
        "message": "⚠️ Saltar tiene consecuencia. Disciplina primero.",
        "xp": s["xp"],
        "mission": get_mission_by_id(s["mission_id"])
    }

# =========================
# FORCE BACK (CASTIGO)
# =========================
@app.post("/force_back")
async def force_back(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, 401)

    s = SESSIONS[sid]

    prev = get_prev_id(s["mission_id"])

    if prev is None:
        return {"message": "No puedes retroceder más"}

    # 🔥 CASTIGO
    s["xp"] = max(0, s["xp"] - 10)
    s["mission_id"] = prev

    return {
        "penalty": True,
        "message": "⛔ Retroceder cuesta progreso.",
        "xp": s["xp"],
        "mission": get_mission_by_id(prev)
    }

# =========================
# RANKING
# =========================
@app.get("/ranking")
def ranking():
    return {
        "ranking": sorted(RANKING.items(), key=lambda x: x[1], reverse=True)[:10]
    }

# =========================
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
