from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os

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
# LOAD GAME (SAFE + ORDERED)
# =========================
def load_game():
    global GAME_DATA, MISSION_IDS

    try:
        if not os.path.exists(CONTENT_PATH):
            GAME_DATA = []
            MISSION_IDS = []
            print("❌ JSON not found")
            return

        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        GAME_DATA = data.get("missions", [])

        # 🔥 ORDER BY ID ASCENDING
        GAME_DATA.sort(key=lambda x: x.get("id", 0))

        # 🔥 EXTRACT IDS
        MISSION_IDS = [m["id"] for m in GAME_DATA]

        print(f"✅ Missions loaded: {len(GAME_DATA)}")

    except Exception as e:
        print("❌ JSON ERROR:", e)
        GAME_DATA = []
        MISSION_IDS = []


load_game()


# =========================
# UTIL: GET MISSION BY ID
# =========================
def get_mission_by_id(mid):
    return next((m for m in GAME_DATA if m.get("id") == mid), None)


# =========================
# UTIL: LOOP NEXT ID
# =========================
def get_next_id(current_id):
    if not MISSION_IDS:
        return None

    if current_id not in MISSION_IDS:
        return MISSION_IDS[0]

    idx = MISSION_IDS.index(current_id)
    next_idx = (idx + 1) % len(MISSION_IDS)
    return MISSION_IDS[next_idx]


# =========================
# ROOT → SESSION HTML
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
    body = await req.json()

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
# GET MISSION
# =========================
@app.post("/get_mission")
async def get_mission(req: Request):
    body = await req.json()
    sid = body.get("session_id")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, status_code=401)

    mid = SESSIONS[sid]["mission_id"]

    return {
        "mission": get_mission_by_id(mid)
    }


# =========================
# JUDGE ANSWER
# =========================
@app.post("/judge")
async def judge(req: Request):
    body = await req.json()

    sid = body.get("session_id")
    decision = body.get("decision")

    if sid not in SESSIONS:
        return JSONResponse({"error": "Invalid session"}, status_code=401)

    s = SESSIONS[sid]

    mission = get_mission_by_id(s["mission_id"])

    if not mission:
        return JSONResponse({"error": "Mission not found"}, status_code=404)

    # find TVID block
    tvid = next((b for b in mission["blocks"] if b["type"] == "tvid"), None)

    if not tvid:
        s["mission_id"] = get_next_id(s["mission_id"])
        return {"xp": s["xp"], "auto": True, "correct": True}

    option = next(
        (o for o in tvid["options"]
         if str(o["code"]).strip().upper() == str(decision).strip().upper()),
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

    # BREAK SYSTEM (anti overload)
    s["break_trigger"] += 1
    break_mode = False

    if s["break_trigger"] >= 10:
        break_mode = True
        s["break_trigger"] = 0

    # ranking update
    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "reason": option.get("reason", {}),
        "next_mission": get_mission_by_id(s["mission_id"]),
        "break": break_mode
    }


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
