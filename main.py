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
SESSIONS = {}
RANKING = {}


# =========================
# LOAD JSON SAFE
# =========================
def load_game():
    global GAME_DATA
    try:
        if not os.path.exists(CONTENT_PATH):
            GAME_DATA = []
            print("❌ JSON not found")
            return

        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            raw = f.read().strip()

            if not raw:
                GAME_DATA = []
                print("❌ Empty JSON")
                return

            data = json.loads(raw)
            GAME_DATA = data.get("missions", [])

            print(f"✅ Missions loaded: {len(GAME_DATA)}")

    except Exception as e:
        print("❌ JSON ERROR:", e)
        GAME_DATA = []


load_game()


# =========================
# UTIL
# =========================
def norm(x):
    return str(x).strip().upper() if x else ""


def get_rank(session_id):
    if not RANKING:
        return 1

    sorted_rank = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)

    for i, (sid, xp) in enumerate(sorted_rank):
        if sid == session_id:
            return i + 1

    return len(sorted_rank)


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
    global GAME_DATA

    if not GAME_DATA:
        load_game()

    body = await req.json() if req else {}
    lang = body.get("profile", {}).get("lang", "en")

    sid = str(uuid.uuid4())

    SESSIONS[sid] = {
        "mission_index": 0,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "lang": lang,
        "break_trigger": 0
    }

    return {
        "session_id": sid,
        "mission": GAME_DATA[0] if GAME_DATA else {}
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

    s = SESSIONS[sid]
    idx = s["mission_index"]

    if idx >= len(GAME_DATA):
        return {"mission": {"id": "END"}}

    return {"mission": GAME_DATA[idx]}


# =========================
# ADAPTIVE AI CORE
# =========================
def adapt_session(s):
    """
    IA simple:
    - muchos errores → reduce XP reward pero añade refuerzo educativo
    - buen streak → bonus XP
    """
    if s["errors"] >= 3:
        s["xp"] = max(0, s["xp"] - 5)
        s["break_trigger"] += 1

    if s["streak"] >= 3:
        s["xp"] += 5


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

    if s["mission_index"] >= len(GAME_DATA):
        return {"finished": True, "xp": s["xp"]}

    mission = GAME_DATA[s["mission_index"]]

    tvid = next((b for b in mission["blocks"] if b["type"] == "tvid"), None)

    if not tvid:
        s["mission_index"] += 1
        return {"xp": s["xp"], "correct": True, "auto": True}

    option = next((o for o in tvid["options"] if norm(o["code"]) == norm(decision)), None)

    if not option:
        return JSONResponse({"error": "Option not found"}, status_code=404)

    correct = option.get("correct", False)

    if correct:
        s["xp"] += 15
        s["streak"] += 1
        s["errors"] = 0
        s["mission_index"] += 1
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["errors"] += 1
        s["streak"] = 0

    # IA ADAPTIVA
    adapt_session(s)

    # BREAK SYSTEM (anti adicción)
    break_mode = False
    if s["break_trigger"] >= 3:
        break_mode = True
        s["break_trigger"] = 0

    # RANKING GLOBAL
    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "reason": option.get("reason", {}),
        "semaphore": "green" if correct else "red",
        "rank": get_rank(sid),
        "break": break_mode
    }


# =========================
# RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
