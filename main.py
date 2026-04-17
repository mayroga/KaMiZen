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
# LOAD CONTENT (SAFE)
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
# GLOBAL SESSIONS STORE
# =========================
sessions = {}

# =========================
# SESSION STATE MACHINE MODEL
# =========================
def create_session():
    return {
        "mission_index": 0,
        "block_index": 0,

        "state": "idle",  # idle | running | waiting | finished

        "last_block_key": None,
        "last_action": None,

        "created_at": time.time(),
        "updated_at": time.time(),

        "decisions": 0,
        "errors": 0
    }

# =========================
# SAFE GET CURRENT BLOCK
# =========================
def get_block(session):

    m = session["mission_index"]
    b = session["block_index"]

    if m >= len(MISSIONS):
        session["state"] = "finished"
        return None

    mission = MISSIONS[m]
    blocks = mission.get("blocks", [])

    if b >= len(blocks):
        return None

    block = blocks[b]

    # 🔒 UNIQUE BLOCK KEY (ANTI DUPLICATION)
    block_key = f"{m}:{b}:{block.get('type')}"

    # prevent double send
    if session["last_block_key"] == block_key and session["last_action"] == "sent":
        return None

    session["last_block_key"] = block_key
    session["last_action"] = "sent"

    return block

# =========================
# STATE ADVANCER (CORE ENGINE)
# =========================
def advance(session):

    session["block_index"] += 1
    session["updated_at"] = time.time()

    mission = MISSIONS[session["mission_index"]]

    if session["block_index"] >= len(mission.get("blocks", [])):
        session["mission_index"] += 1
        session["block_index"] = 0

        # safety check
        if session["mission_index"] >= len(MISSIONS):
            session["state"] = "finished"

    session["last_block_key"] = None
    session["last_action"] = "advance"

# =========================
# FORMAT OUTPUT (FRONTEND SAFE)
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

    out = {
        "type": block.get("type")
    }

    for k in ["text", "analysis", "question"]:
        if k in block:
            out[k] = block[k]

    if "options" in block:
        out["options"] = block["options"]

    if "duration_sec" in block:
        out["duration_sec"] = block["duration_sec"]

    return out

# =========================
# DECISION ENGINE (TVID)
# =========================
def evaluate(block, decision):

    if not block or "options" not in block:
        return None

    for opt in block["options"]:
        if opt.get("code") == decision:
            return opt

    return None

# =========================
# SESSION VALIDATION (ANTI CRASH)
# =========================
def validate_session(session):

    if not session:
        return False

    if session.get("state") == "finished":
        return False

    if session["errors"] > 10:
        session["state"] = "finished"
        return False

    return True

# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")

# =========================
# START SESSION
# =========================
@app.post("/start")
def start():

    sid = str(uuid.uuid4())
    sessions[sid] = create_session()

    session = sessions[sid]
    block = get_block(session)

    session["state"] = "running"

    return JSONResponse({
        "session_id": sid,
        "story": format_block(block)
    })

# =========================
# MAIN STATE MACHINE ROUTE
# =========================
@app.post("/judge")
def judge(data: dict):

    sid = data.get("session_id")
    decision = data.get("decision")

    session = sessions.get(sid)

    if not validate_session(session):
        return JSONResponse({
            "story": {
                "type": "error",
                "text": {
                    "en": "Session invalid or expired",
                    "es": "Sesión inválida o expirada"
                }
            }
        })

    current_block = get_block(session)

    if not current_block:
        return JSONResponse({
            "story": {
                "type": "end",
                "text": {
                    "en": "NO MORE CONTENT",
                    "es": "NO HAY MÁS CONTENIDO"
                }
            }
        })

    feedback = None

    try:

        # =========================
        # TVID DECISION FLOW
        # =========================
        if decision and decision != "NEXT":
            feedback = evaluate(current_block, decision)
            session["decisions"] += 1

        # =========================
        # ADVANCE RULE
        # =========================
        should_advance = (
            decision == "NEXT" or feedback is not None
        )

        if should_advance:
            advance(session)

        next_block = get_block(session)

        session["state"] = "running"
        session["updated_at"] = time.time()

        return JSONResponse({
            "feedback": feedback,
            "story": format_block(next_block)
        })

    except Exception as e:

        session["errors"] += 1
        print("ENGINE ERROR:", e)

        return JSONResponse({
            "story": {
                "type": "error",
                "text": {
                    "en": "Engine error",
                    "es": "Error del sistema"
                }
            }
        })

# =========================
# DEBUG / RELOAD CONTENT
# =========================
@app.get("/reload")
def reload():

    global MISSIONS
    MISSIONS = load_content()

    return {
        "status": "reloaded",
        "missions": len(MISSIONS)
    }

# =========================
# SESSION INSPECTOR (DEBUG TOOL)
# =========================
@app.get("/session/{sid}")
def inspect(sid: str):

    session = sessions.get(sid)

    if not session:
        return {"error": "not found"}

    return {
        "session": session
    }
