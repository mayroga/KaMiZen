from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os
import random

app = FastAPI()

# ===============================
# STATIC
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD CONTENT
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
# SESSIONS
# ===============================
sessions = {}

# ===============================
# HELPERS
# ===============================

def is_breathing(block):
    return block.get("type") == "breathing"

def is_silence(block):
    return block.get("type") == "silence_challenge"

def is_quiz(block):
    return "options" in block and block.get("type") in [
        "quiz", "tvid", "mini_riddle", "mini_math", "reflection"
    ]

def get_first_valid_block(mission):
    """
    Nunca iniciar con respiración obligatoria
    """
    for b in mission["blocks"]:
        if not is_breathing(b):
            return b
    return mission["blocks"][0]


# ===============================
# FORMAT BLOCK (FRONTEND SAFE)
# ===============================
def format_block(block):

    base = {
        "type": block.get("type")
    }

    # TEXT
    if "text" in block:
        base["text"] = block["text"]

    # QUESTION
    if "question" in block:
        base["question"] = block["question"]

    # OPTIONS (FORCED 3 UI FRIENDLY)
    if "options" in block:
        opts = []

        for o in block["options"]:
            opts.append({
                "code": o.get("code", "TDB"),
                "text": o.get("text"),
                "correct": o.get("correct", False),
                "reason": o.get("reason", {})
            })

        base["options"] = opts

    # SILENCE
    if is_silence(block):
        base["duration_sec"] = block.get("duration_sec", 20)
        base["reward"] = block.get("reward", {})
        base["phrases"] = block.get("phrases", [
            "POWER", "LOVE", "ENERGY", "PEACE"
        ])

    # BREATH
    if is_breathing(block):
        base["breath"] = {
            "mode": block.get("mode", "auto"),
            "duration": block.get("duration", 3)
        }

    return base


# ===============================
# FLOW CONTROL
# ===============================
def get_next_block(session):

    mi = session["mission_index"]
    bi = session["block_index"]

    if mi >= len(MISSIONS):
        return {
            "type": "end",
            "text": {"en": "SESSION COMPLETE", "es": "SESIÓN TERMINADA"}
        }

    mission = MISSIONS[mi]
    blocks = mission["blocks"]

    # END MISSION
    if bi >= len(blocks):

        session["mission_index"] += 1
        session["block_index"] = 0

        if session["mission_index"] >= len(MISSIONS):
            return {
                "type": "end",
                "text": {"en": "SESSION COMPLETE", "es": "SESIÓN TERMINADA"}
            }

        return get_first_valid_block(MISSIONS[session["mission_index"]])

    block = blocks[bi]
    session["block_index"] += 1

    return block


# ===============================
# VALIDATION LOGIC
# ===============================
def evaluate(block, decision):

    if not is_quiz(block):
        return {
            "correct": True,
            "reason": {"en": "Flow continues", "es": "Continuación del flujo"}
        }

    for o in block.get("options", []):
        if o.get("code") == decision:

            return {
                "correct": o.get("correct", False),
                "reason": o.get("reason", {
                    "en": "No explanation",
                    "es": "Sin explicación"
                })
            }

    return {
        "correct": False,
        "reason": {
            "en": "Invalid option",
            "es": "Opción inválida"
        }
    }


# ===============================
# ROUTES
# ===============================

@app.get("/")
def home():
    return FileResponse("static/session.html")


@app.post("/start")
def start():

    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "mission_index": 0,
        "block_index": 0,
        "score": 0
    }

    if not MISSIONS:
        return JSONResponse({
            "session_id": session_id,
            "story": {
                "type": "error",
                "text": {"en": "No content", "es": "Sin contenido"}
            }
        })

    first = get_first_valid_block(MISSIONS[0])

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(first)
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

    # CURRENT BLOCK (RE-READ CONTEXT)
    mi = session["mission_index"]
    bi = session["block_index"]

    if mi >= len(MISSIONS):
        return JSONResponse({
            "story": {
                "type": "end",
                "text": {"en": "END", "es": "FIN"}
            }
        })

    mission = MISSIONS[mi]
    block = mission["blocks"][bi-1 if bi > 0 else 0]

    # EVALUATION
    result = evaluate(block, decision)

    # SCORE UPDATE
    if result["correct"]:
        session["score"] += 1

    # FEEDBACK BLOCK
    feedback = {
        "type": "feedback",
        "correct": result["correct"],
        "reason": result["reason"]
    }

    # ADVANCE FLOW
    next_block = get_next_block(session)

    # MERGE FEEDBACK + NEXT
    return JSONResponse({
        "story": format_block(next_block),
        "feedback": feedback
    })


# ===============================
# RELOAD CONTENT
# ===============================
@app.get("/reload")
def reload_content():
    global MISSIONS
    MISSIONS = load_content()
    return {
        "status": "reloaded",
        "missions": len(MISSIONS)
    }
