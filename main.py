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
            return data.get("missions", [])
    except Exception as e:
        print("ERROR LOADING JSON:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSION STORAGE
# =========================
sessions = {}

# =========================
# HELPERS
# =========================

def get_mission(session):
    idx = session["mission_index"]
    if idx >= len(MISSIONS):
        return None
    return MISSIONS[idx]


def get_blocks(session):
    mission = get_mission(session)
    if not mission:
        return []
    return mission.get("blocks", [])


def get_current_block(session):
    blocks = get_blocks(session)
    idx = session["block_index"]

    if idx >= len(blocks):
        return None

    return blocks[idx]


def advance(session):
    """
    Avanza de bloque respetando misiones
    """
    session["block_index"] += 1

    blocks = get_blocks(session)

    if session["block_index"] >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0


def format_block(block):
    """
    Prepara el bloque para el frontend
    """
    if not block:
        return None

    data = {
        "type": block.get("type")
    }

    # TEXTOS
    if "text" in block:
        data["text"] = block["text"]

    if "analysis" in block:
        data["analysis"] = block["analysis"]

    if "question" in block:
        data["question"] = block["question"]

    # DURACIÓN (CLAVE PARA FRONT)
    if "duration_sec" in block:
        data["duration_sec"] = block.get("duration_sec", 0)

    # GUIDE (breath / riso)
    if "guide" in block:
        data["guide"] = block.get("guide", {})

    # OPTIONS (TVID)
    if "options" in block:
        data["options"] = []
        for opt in block["options"]:
            data["options"].append({
                "code": opt.get("code"),
                "text": opt.get("text"),
                "correct": opt.get("correct", False),
                "reason": opt.get("reason", {})
            })

    # REWARD (silence)
    if "reward" in block:
        data["reward"] = block.get("reward", {})

    return data


def evaluate_answer(block, decision):
    """
    Evalúa respuestas SOLO si hay opciones
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
    Lógica inteligente de avance
    """

    if not block:
        return False

    # Si es decisión (TVID)
    if "options" in block:
        return True

    # Control manual del usuario
    if decision in ["NEXT", "SKIP"]:
        return True

    # Bloques pasivos NO avanzan solos
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

    first_block = get_current_block(sessions[session_id])

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(first_block)
    })


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

    current_block = get_current_block(session)

    response = {}

    # =========================
    # EVALUAR RESPUESTA (SI APLICA)
    # =========================
    feedback = evaluate_answer(current_block, decision)

    if feedback:
        response["feedback"] = feedback

    # =========================
    # CONTROL DE AVANCE REAL
    # =========================
    if should_advance(current_block, decision):
        advance(session)

    next_block = get_current_block(session)

    # =========================
    # FIN DE CONTENIDO
    # =========================
    if not next_block:
        response["story"] = {
            "type": "end",
            "text": {
                "en": "SESSION COMPLETE",
                "es": "SESIÓN COMPLETADA"
            }
        }
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
