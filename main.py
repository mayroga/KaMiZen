from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

CONTENT_PATH = os.path.join("static", "kamizen_content.json")

# =========================
# LOAD JSON
# =========================
def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("missions", [])
    except Exception as e:
        print("JSON ERROR:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSIONS
# =========================
sessions = {}

# =========================
# CREATE SESSION
# =========================
def create_session():
    return {
        "mission_index": 0,
        "block_index": 0,
        "current_block_id": None
    }

# =========================
# GET BLOCK SAFE
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

    # 🔒 BLOQUE IDENTIDAD REAL (evita repetición)
    block_id = f"{m}:{b}:{block.get('type')}"

    if session.get("current_block_id") == block_id:
        return None

    session["current_block_id"] = block_id

    return block

# =========================
# ADVANCE ENGINE
# =========================
def advance(session):
    session["block_index"] += 1

    mission = MISSIONS[session["mission_index"]]
    blocks = mission.get("blocks", [])

    if session["block_index"] >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0

    session["current_block_id"] = None

# =========================
# FORMAT SAFE OUTPUT
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
# EVALUATION
# =========================
def evaluate(block, decision):
    if not block or "options" not in block:
        return None

    for o in block["options"]:
        if o.get("code") == decision:
            return o

    return None

# =========================
# ROUTES
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")

# =========================
# START
# =========================
@app.post("/start")
def start():

    session_id = str(uuid.uuid4())
    sessions[session_id] = create_session()

    session = sessions[session_id]
    block = get_block(session)

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block)
    })

# =========================
# ENGINE CORE
# =========================
@app.post("/judge")
def judge(data: dict):

    session_id = data.get("session_id")
    decision = data.get("decision")

    session = sessions.get(session_id)

    if not session:
        return {"story": {"type": "error", "text": {"en": "Session expired", "es": "Sesión expirada"}}}

    current = get_block(session)

    feedback = None

    # =========================
    # ANSWER FLOW
    # =========================
    if decision != "NEXT":
        feedback = evaluate(current, decision)

    # =========================
    # ADVANCE FLOW
    # =========================
    if decision == "NEXT" or feedback:
        advance(session)

    next_block = get_block(session)

    return JSONResponse({
        "feedback": feedback,
        "story": format_block(next_block)
    })

# =========================
# RELOAD JSON
# =========================
@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "missions": len(MISSIONS)}
