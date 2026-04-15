from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os
import random

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

    try:
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

    except Exception:
        GAME_DATA, MISSION_IDS = [], []

load_game()

# =========================
# UTILS
# =========================
def get_mission(mid):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)

def get_tvid(mission):
    return next((b for b in mission.get("blocks", []) if b.get("type") == "tvid"), None)

def normalize(x):
    return str(x).strip().upper()

def next_mission(current_id, visited):
    remaining = [mid for mid in MISSION_IDS if mid not in visited]
    if not remaining:
        return MISSION_IDS[0] if MISSION_IDS else None
    return random.choice(remaining)

def prev_mission(current_id):
    if current_id not in MISSION_IDS:
        return None
    idx = MISSION_IDS.index(current_id)
    return MISSION_IDS[max(0, idx - 1)]

# =========================
# COACH SYSTEM (VARIADO, NO REPETITIVO)
# =========================
COACH_LINES = {
    "start": [
        "Inicia el enfoque.",
        "Atención activa.",
        "Entrando en modo entrenamiento.",
        "Respira y observa."
    ],
    "correct": [
        "Bien hecho, sigues avanzando.",
        "Correcto, mantén el ritmo.",
        "Buen control mental.",
        "Precisión lograda."
    ],
    "wrong": [
        "Observa el error, aprende.",
        "Reajusta tu atención.",
        "No es fallo, es corrección.",
        "Vuelve al foco."
    ],
    "breathing": [
        "Inhala lento...",
        "Exhala suavemente...",
        "Siente tu respiración...",
        "Control corporal activo..."
    ],
    "level_up": [
        "Subiste de nivel mental.",
        "Mayor control logrado.",
        "Evolución cognitiva activa."
    ]
}

def coach(mode):
    return random.choice(COACH_LINES.get(mode, COACH_LINES["start"]))

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

    first = MISSION_IDS[0] if MISSION_IDS else None

    SESSIONS[sid] = {
        "mission_id": first,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "visited": [],
        "time_limit": 0,
        "session_steps": 0
    }

    return {
        "session_id": sid,
        "mission": get_mission(first),
        "coach": coach("start")
    }

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
        "coach": coach("start")
    }

# =========================
# CORE JUDGE (ORCHESTRATED LOGIC FIXED)
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
        return JSONResponse({"error": "Mission not found"}, 404)

    tvid = get_tvid(mission)

    # =========================
    # IF NO TVID → PURE FLOW
    # =========================
    if not tvid:
        s["visited"].append(s["mission_id"])
        s["mission_id"] = next_mission(s["mission_id"], s["visited"])

        return {
            "correct": True,
            "auto": True,
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
    # BALANCED REWARD SYSTEM (NO WRONG LOGIC)
    # =========================
    if correct:
        s["xp"] += 10 + (s["streak"] * 2)
        s["streak"] += 1
        s["errors"] = 0
        coach_msg = coach("correct")
    else:
        s["xp"] = max(0, s["xp"] - 4)
        s["errors"] += 1
        s["streak"] = 0
        coach_msg = coach("wrong")

    # =========================
    # BREATHING TRIGGER (ONLY WHEN NEEDED)
    # =========================
    breathing = False
    if "breathing" in [b.get("type") for b in mission.get("blocks", [])]:
        breathing = True

    # =========================
    # SESSION FLOW CONTROL (NOT LINEAR)
    # =========================
    s["session_steps"] += 1

    if s["session_steps"] % 6 == 0:
        s["mission_id"] = next_mission(s["mission_id"], s["visited"])
    else:
        s["visited"].append(s["mission_id"])
        s["mission_id"] = next_mission(s["mission_id"], s["visited"])

    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "streak": s["streak"],
        "reason": option.get("reason", {}),
        "next_mission": get_mission(s["mission_id"]),
        "coach": coach_msg,
        "breathing": breathing
    }

# =========================
# FORCE NAVIGATION (CONTROLLED)
# =========================
@app.post("/force_next")
async def force_next(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    s["xp"] = max(0, s["xp"] - 6)
    s["mission_id"] = next_mission(s["mission_id"], s["visited"])

    return {
        "message": "Cambio de escena aplicado",
        "xp": s["xp"],
        "mission": get_mission(s["mission_id"])
    }

@app.post("/force_back")
async def force_back(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    s = SESSIONS.get(sid)
    if not s:
        return JSONResponse({"error": "Invalid session"}, 401)

    prev = prev_mission(s["mission_id"])

    if not prev:
        return {"message": "No hay retroceso posible"}

    s["xp"] = max(0, s["xp"] - 4)
    s["mission_id"] = prev

    return {
        "message": "Retroceso aplicado con costo",
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
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
