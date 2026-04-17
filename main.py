from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os
import time

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

CONTENT_PATH = os.path.join("static", "kamizen_content.json")

# =========================
# LOAD CONTENT SAFE
# =========================
def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("missions", [])
    except Exception as e:
        print("JSON ERROR:", e)
        return []

MISSIONS = load_content()

# =========================
# MEMORY SYSTEM
# =========================
players = {}
sessions = {}

# =========================
# PLAYER CREATE
# =========================
@app.post("/create_player")
def create_player(data: dict):

    player_id = str(uuid.uuid4())

    players[player_id] = {
        "real_name": data.get("real_name"),
        "avatar_name": data.get("avatar_name"),
        "created_at": time.time(),
        "level": 1,
        "xp": 0
    }

    return {
        "player_id": player_id,
        "avatar_name": data.get("avatar_name")
    }

# =========================
# SESSION CREATE
# =========================
def create_session(player_id=None):

    return {
        "player_id": player_id,
        "mission_index": 0,
        "block_index": 0,
        "last_block_key": None,
        "locked": False
    }

# =========================
# GET CURRENT BLOCK SAFE
# =========================
def get_block(session):

    m = session["mission_index"]
    b = session["block_index"]

    if m >= len(MISSIONS):
        return None

    mission = MISSIONS[m]
    blocks = mission.get("blocks", [])

    if b >= len(blocks):
        return None

    block = blocks[b]

    # 🔒 anti-repeat safety key
    key = f"{m}:{b}:{block.get('type')}"

    if session.get("last_block_key") == key:
        return None

    session["last_block_key"] = key

    return block

# =========================
# ADVANCE ENGINE SAFE
# =========================
def advance(session):

    session["block_index"] += 1

    mission = MISSIONS[session["mission_index"]]
    blocks = mission.get("blocks", [])

    if session["block_index"] >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0

    session["last_block_key"] = None

# =========================
# FORMAT OUTPUT SAFE
# =========================
def format_block(block):

    if not block:
        return {
            "type": "end",
            "text": {
                "en": "SESSION COMPLETE",
                "es": "SESIÓN COMPLETADA"
            }
        }

    out = {"type": block.get("type")}

    for k in ["text", "analysis", "question"]:
        if k in block:
            out[k] = block[k]

    if "duration_sec" in block:
        out["duration_sec"] = block["duration_sec"]

    if "options" in block:
        out["options"] = block["options"]

    return out

# =========================
# EVALUATION ENGINE
# =========================
def evaluate(block, decision):

    if not block or "options" not in block:
        return None

    for opt in block["options"]:
        if opt.get("code") == decision:
            return opt

    return None

# =========================
# HOME
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")

# =========================
# START SESSION (PLAYER LINKED)
# =========================
@app.post("/start")
def start(data: dict = None):

    # player_id optional (future expansion)
    player_id = None

    session_id = str(uuid.uuid4())
    sessions[session_id] = create_session(player_id)

    session = sessions[session_id]

    block = get_block(session)

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block)
    })

# =========================
# CORE ENGINE (STATE MACHINE REAL)
# =========================
@app.post("/judge")
def judge(data: dict):

    session_id = data.get("session_id")
    decision = data.get("decision")

    session = sessions.get(session_id)

    if not session:
        return JSONResponse({
            "story": {
                "type": "error",
                "text": {
                    "en": "Session expired",
                    "es": "Sesión expirada"
                }
            }
        })

    current = get_block(session)

    feedback = None

    # =========================
    # ACTION LOGIC
    # =========================
    if decision != "NEXT":
        feedback = evaluate(current, decision)

    # =========================
    # ADVANCE RULE
    # =========================
    if decision == "NEXT" or feedback:
        advance(session)

    next_block = get_block(session)

    return JSONResponse({
        "feedback": feedback,
        "story": format_block(next_block)
    })

# =========================
# RELOAD CONTENT (DEV ONLY)
# =========================
@app.get("/reload")
def reload():

    global MISSIONS
    MISSIONS = load_content()

    return {
        "status": "reloaded",
        "missions": len(MISSIONS)
    }
