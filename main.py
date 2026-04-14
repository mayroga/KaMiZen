from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()

# ===============================
# STATIC
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD JSON CONTENT
# ===============================
CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("missions", [])
    except Exception as e:
        print("[ERROR] JSON LOAD FAIL:", e)
        return []

MISSIONS = load_content()

# ===============================
# SESSION STORAGE
# ===============================
sessions = {}

# ===============================
# HELPERS
# ===============================
def get_first_valid_block(mission):
    """
    Evita comenzar con breathing
    """
    for block in mission["blocks"]:
        if block["type"] != "breathing":
            return block
    return mission["blocks"][0]


def get_next_block(session):
    mission_index = session["mission_index"]
    block_index = session["block_index"]

    if mission_index >= len(MISSIONS):
        return {"type": "end", "text": {"en": "END", "es": "FIN"}}

    mission = MISSIONS[mission_index]
    blocks = mission["blocks"]

    if block_index >= len(blocks):
        # siguiente misión
        session["mission_index"] += 1
        session["block_index"] = 0

        if session["mission_index"] >= len(MISSIONS):
            return {"type": "end", "text": {"en": "END", "es": "FIN"}}

        return get_first_valid_block(MISSIONS[session["mission_index"]])

    block = blocks[block_index]
    session["block_index"] += 1

    return block


def format_block(block):
    """
    Convierte cualquier tipo de bloque en formato estándar para el frontend
    """

    base = {
        "type": block.get("type"),
    }

    # TEXT
    if "text" in block:
        base["text"] = block["text"]

    # ANALYSIS
    if "analysis" in block:
        base["analysis"] = block["analysis"]

    # OPTIONS (quiz / tvid)
    if "options" in block:
        base["options"] = []
        for opt in block["options"]:
            base["options"].append({
                "code": opt.get("code", "TDB"),
                "text": opt.get("text"),
                "correct": opt.get("correct", False),
                "reason": opt.get("reason", {})
            })

    # MINI RIDDLE / MATH
    if block.get("type") in ["mini_riddle", "mini_math"]:
        base["question"] = block.get("question")
        base["answers"] = block.get("answers")

    # SILENCE
    if block.get("type") == "silence_challenge":
        base["duration_sec"] = block.get("duration_sec", 20)
        base["reward"] = block.get("reward", {})

    # FINAL LESSON
    if block.get("type") == "final_lesson":
        base["text"] = block.get("text")

    return base


# ===============================
# ROUTES
# ===============================

@app.get("/")
def home():
    return FileResponse("static/session.html")


@app.post("/start")
def start():
    session_id = str(uuid.uuid4())

    session = {
        "mission_index": 0,
        "block_index": 0
    }

    sessions[session_id] = session

    if not MISSIONS:
        return JSONResponse({
            "session_id": session_id,
            "story": {
                "type": "error",
                "text": {"en": "No content loaded", "es": "No hay contenido"}
            }
        })

    first_block = get_first_valid_block(MISSIONS[0])

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
                "text": {"en": "Session expired", "es": "Sesión expirada"}
            }
        })

    # Aquí puedes agregar lógica futura (XP, castigos, etc.)
    # Por ahora solo avanza

    next_block = get_next_block(session)

    return JSONResponse({
        "story": format_block(next_block)
    })


# ===============================
# DEBUG RELOAD CONTENT
# ===============================
@app.get("/reload")
def reload_content():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "missions": len(MISSIONS)}
