from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()

# =========================
# STATIC
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# LOAD CONTENT
# =========================
CONTENT_PATH = os.path.join("static", "kamizen_content.json")

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            missions = data.get("missions", [])
            print(f"MISSIONS LOADED: {len(missions)}")
            return missions
    except Exception as e:
        print("ERROR LOADING JSON:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSION MEMORY
# =========================
sessions = {}

# =========================
# CORE ENGINE
# =========================

def get_mission(session):
    i = session["mission_index"]
    if i >= len(MISSIONS):
        return None
    return MISSIONS[i]


def get_blocks(session):
    mission = get_mission(session)
    if not mission:
        return []
    return mission.get("blocks", [])


def get_current_block(session):
    blocks = get_blocks(session)
    i = session["block_index"]

    if i >= len(blocks):
        return None

    return blocks[i]


def advance(session):
    session["block_index"] += 1

    blocks = get_blocks(session)

    # pasa de misión automáticamente
    if session["block_index"] >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0


def safe_end():
    return {
        "type": "end",
        "text": {
            "en": "SESSION COMPLETE",
            "es": "SESIÓN COMPLETADA"
        }
    }


# =========================
# FORMAT (CLAVE)
# =========================

def format_block(block):
    """
    Nunca devuelve vacío → evita pantalla en blanco
    """
    if not block:
        return safe_end()

    data = {
        "type": block.get("type", "unknown")
    }

    # TEXTOS
    if "text" in block:
        data["text"] = block["text"]

    if "analysis" in block:
        data["analysis"] = block["analysis"]

    if "question" in block:
        data["question"] = block["question"]

    # DURACIÓN
    if "duration_sec" in block:
        data["duration_sec"] = block.get("duration_sec", 0)

    # GUIDE
    if "guide" in block:
        data["guide"] = block.get("guide", {})

    # OPTIONS (TVID)
    if "options" in block:
        formatted_options = []

        for o in block["options"]:
            formatted_options.append({
                "code": o.get("code"),
                "text": o.get("text"),
                "correct": o.get("correct", False),
                "reason": o.get("reason", {})
            })

        data["options"] = formatted_options

    # REWARD (silence)
    if "reward" in block:
        data["reward"] = block.get("reward", {})

    return data


# =========================
# LOGIC
# =========================

def evaluate_answer(block, decision):
    """
    Solo evalúa si es TVID real
    """
    if not block or "options" not in block:
        return None

    for opt in block["options"]:
        if opt.get("code") == decision:
            return {
                "correct": opt.get("correct", False),
                "reason": opt.get("reason", {})
            }

    return None


def should_advance(block, decision):
    """
    Control total del flujo
    """

    if not block:
        return False

    # RESPUESTA TVID → SIEMPRE avanza
    if "options" in block:
        return True

    # CONTROL USUARIO
    if decision in ["NEXT", "SKIP"]:
        return True

    # BLOQUES PASIVOS → esperan
    return False


# =========================
# ROUTES
# =========================

@app.get("/")
def home():
    return FileResponse("static/session.html")


@app.post("/start")
def start():

    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "mission_index": 0,
        "block_index": 0
    }

    first = get_current_block(sessions[session_id])

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(first)
    })


@app.post("/judge")
def judge(data: dict):

    session_id = data.get("session_id")
    decision = data.get("decision")

    session = sessions.get(session_id)

    # SESIÓN INVALIDA
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

    current = get_current_block(session)

    response = {}

    # =========================
    # FEEDBACK (TVID)
    # =========================
    feedback = evaluate_answer(current, decision)

    if feedback:
        response["feedback"] = feedback

    # =========================
    # AVANCE CONTROLADO
    # =========================
    if should_advance(current, decision):
        advance(session)

    next_block = get_current_block(session)

    # =========================
    # FIN TOTAL
    # =========================
    if not next_block:
        response["story"] = safe_end()
        return JSONResponse(response)

    response["story"] = format_block(next_block)

    return JSONResponse(response)


@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {
        "status": "reloaded",
        "missions": len(MISSIONS)
    }
