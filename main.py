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
# LOAD JSON
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
# SESSION MEMORY
# =========================
sessions = {}

# =========================
# CORE ENGINE (SIN LÓGICA EXTRA)
# =========================

def get_current_block(session):
    m = session["mission_index"]
    b = session["block_index"]

    if m >= len(MISSIONS):
        return None

    mission = MISSIONS[m]
    blocks = mission.get("blocks", [])

    if b >= len(blocks):
        return None

    return blocks[b]


def advance(session):
    session["block_index"] += 1

    m = session["mission_index"]
    b = session["block_index"]

    if m < len(MISSIONS):
        blocks = MISSIONS[m].get("blocks", [])

        # pasa a siguiente misión
        if b >= len(blocks):
            session["mission_index"] += 1
            session["block_index"] = 0


def format_block(block):
    """
    Siempre devuelve algo válido
    """
    if not block:
        return {
            "type": "end",
            "text": {
                "en": "SESSION COMPLETE",
                "es": "SESIÓN COMPLETADA"
            }
        }

    data = {
        "type": block.get("type", "unknown")
    }

    # textos
    if "text" in block:
        data["text"] = block["text"]

    if "analysis" in block:
        data["analysis"] = block["analysis"]

    if "question" in block:
        data["question"] = block["question"]

    # duración
    if "duration_sec" in block:
        data["duration_sec"] = block.get("duration_sec", 0)

    # guía
    if "guide" in block:
        data["guide"] = block.get("guide", {})

    # opciones (TVID)
    if "options" in block:
        data["options"] = []
        for o in block["options"]:
            data["options"].append({
                "code": o.get("code"),
                "text": o.get("text"),
                "correct": o.get("correct", False),
                "reason": o.get("reason", {})
            })

    # reward
    if "reward" in block:
        data["reward"] = block.get("reward", {})

    return data


def evaluate_answer(block, decision):
    """
    SOLO evalúa, NO avanza
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

    block = get_current_block(sessions[session_id])

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block)
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

    current = get_current_block(session)

    response = {}

    # =========================
    # EVALUAR RESPUESTA
    # =========================
    feedback = evaluate_answer(current, decision)

    if feedback:
        response["feedback"] = feedback

    # =========================
    # AVANCE SOLO SI FRONT LO PIDE
    # =========================
    if decision == "NEXT":
        advance(session)

    # =========================
    # SIGUIENTE BLOQUE
    # =========================
    next_block = get_current_block(session)

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
