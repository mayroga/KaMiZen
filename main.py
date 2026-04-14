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
# LOAD GAME (ULTRA ROBUST)
# =========================
def load_game():
    global GAME_DATA, MISSION_IDS

    try:
        if not os.path.exists(CONTENT_PATH):
            print("❌ JSON not found")
            GAME_DATA = []
            MISSION_IDS = []
            return

        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        missions = data.get("missions", [])

        # 🔥 VALIDACIÓN FLEXIBLE
        if not isinstance(missions, list):
            print("❌ Invalid missions format")
            GAME_DATA = []
            MISSION_IDS = []
            return

        # 🔥 LIMPIEZA SEGURA (sin romper estructura)
        clean = []
        for m in missions:
            if isinstance(m, dict) and "id" in m:
                clean.append(m)

        # 🔥 ORDENAR
        clean.sort(key=lambda x: x.get("id", 0))

        GAME_DATA = clean
        MISSION_IDS = [m.get("id") for m in clean if isinstance(m.get("id"), int)]

        print(f"✅ Missions loaded: {len(GAME_DATA)}")

    except json.JSONDecodeError:
        print("❌ JSON FORMAT ERROR")
        GAME_DATA = []
        MISSION_IDS = []

    except Exception as e:
        print("❌ LOAD ERROR:", e)
        GAME_DATA = []
        MISSION_IDS = []


load_game()


# =========================
# UTILS
# =========================
def get_mission_by_id(mid: int):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)


def get_next_id(current_id: int):
    if not MISSION_IDS:
        return None

    if current_id not in MISSION_IDS:
        return MISSION_IDS[0]

    idx = MISSION_IDS.index(current_id)
    return MISSION_IDS[(idx + 1) % len(MISSION_IDS)]


def find_tvid_block(mission: Dict[str, Any]):
    blocks = mission.get("blocks", [])
    if not isinstance(blocks, list):
        return None

    return next((b for b in blocks if b.get("type") == "tvid"), None)


def normalize(text):
    return str(text).strip().upper()


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
    try:
        body = await req.json()
    except:
        body = {}

    sid = str(uuid.uuid4())
    first_id = MISSION_IDS[0] if MISSION_IDS else None

    SESSIONS[sid] = {
        "mission_id": first_id,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "break_trigger": 0
    }

    return {
        "session_id": sid,
        "mission": get_mission_by_id(first_id)
    }


# =========================
# GET CURRENT MISSION
# =========================
@app.post("/get_mission")
async def get_mission(req: Request):
    try:
        body = await req.json()
    except:
        return JSONResponse({"error": "Invalid body"}, status_code=400)

    sid = body.get("session_id")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, status_code=401)

    mid = SESSIONS[sid].get("mission_id")

    return {
        "mission": get_mission_by_id(mid)
    }


# =========================
# JUDGE DECISION
# =========================
@app.post("/judge")
async def judge(req: Request):
    try:
        body = await req.json()
    except:
        return JSONResponse({"error": "Invalid body"}, status_code=400)

    sid = body.get("session_id")
    decision = body.get("decision")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, status_code=401)

    s = SESSIONS[sid]
    mission = get_mission_by_id(s.get("mission_id"))

    if not mission:
        return JSONResponse({"error": "Mission not found"}, status_code=404)

    tvid = find_tvid_block(mission)

    # 🔥 SI NO HAY TVID → AVANZA SOLO
    if not tvid:
        s["mission_id"] = get_next_id(s["mission_id"])
        return {
            "xp": s["xp"],
            "auto": True,
            "correct": True,
            "next_mission": get_mission_by_id(s["mission_id"])
        }

    options = tvid.get("options", [])

    option = next(
        (o for o in options if normalize(o.get("code")) == normalize(decision)),
        None
    )

    if not option:
        return JSONResponse({"error": "Option not found"}, status_code=404)

    correct = option.get("correct", False)

    if correct:
        s["xp"] += 15
        s["streak"] += 1
        s["errors"] = 0
        s["mission_id"] = get_next_id(s["mission_id"])
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["errors"] += 1
        s["streak"] = 0

    # =========================
    # BREAK SYSTEM
    # =========================
    s["break_trigger"] += 1
    break_mode = False

    if s["break_trigger"] >= 10:
        break_mode = True
        s["break_trigger"] = 0

    # =========================
    # RANKING UPDATE
    # =========================
    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "streak": s["streak"],
        "errors": s["errors"],
        "reason": option.get("reason", {}),
        "next_mission": get_mission_by_id(s["mission_id"]),
        "break": break_mode
    }


# =========================
# RANKING
# =========================
@app.get("/ranking")
def ranking():
    sorted_rank = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)
    return {"ranking": sorted_rank[:10]}


# =========================
# RELOAD CONTENT (PRO)
# =========================
@app.post("/reload")
def reload_content():
    load_game()
    return {"status": "reloaded", "missions": len(GAME_DATA)}


# =========================
# HEALTH CHECK
# =========================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "missions": len(GAME_DATA),
        "sessions": len(SESSIONS)
    }


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
