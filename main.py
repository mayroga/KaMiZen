from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD CONTENT
# ===============================
CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("missions", [])
    except Exception as e:
        print("JSON ERROR:", e)
        return []

MISSIONS = load_content()

# ===============================
# SESSIONS MEMORY (IN RAM)
# ===============================
sessions = {}

# ===============================
# FLOW ENGINE
# ===============================

def next_block(session):

    mission = MISSIONS[session["m"]]
    blocks = mission["blocks"]

    # avanzar bloque
    if session["i"] >= len(blocks):

        session["m"] += 1
        session["i"] = 0

        # fin total
        if session["m"] >= len(MISSIONS):
            return {
                "type": "end",
                "text": {
                    "en": "Session completed",
                    "es": "Sesión completada"
                }
            }

        blocks = MISSIONS[session["m"]]["blocks"]

    block = blocks[session["i"]]
    session["i"] += 1

    return block


# ===============================
# FORMAT CLEAN OUTPUT
# ===============================
def format_block(block):

    return {
        "type": block.get("type"),
        "text": block.get("text"),
        "analysis": block.get("analysis"),
        "options": block.get("options") if block.get("type") == "tvid" else None,
        "guide": block.get("guide"),
        "duration_sec": block.get("duration_sec"),
        "reward": block.get("reward")
    }


# ===============================
# START SESSION
# ===============================
@app.post("/start")
def start(data: dict):

    lang = data.get("profile", {}).get("lang", "en")

    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "m": 0,
        "i": 0,
        "lang": lang,
        "last": None
    }

    block = next_block(sessions[session_id])
    sessions[session_id]["last"] = block

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block)
    })


# ===============================
# JUDGE (ONLY TVID LOGIC)
# ===============================
@app.post("/judge")
def judge(data: dict):

    session_id = data.get("session_id")
    decision = data.get("decision")

    session = sessions.get(session_id)

    if not session:
        return JSONResponse({
            "next": {
                "type": "error",
                "text": {
                    "en": "Session expired",
                    "es": "Sesión expirada"
                }
            }
        })

    last = session["last"]

    feedback = None

    # ===========================
    # ONLY TVID HAS DECISION LOGIC
    # ===========================
    if last and last.get("type") == "tvid":

        options = last.get("options", [])

        selected = next((o for o in options if o["code"] == decision), None)

        if selected:

            feedback = {
                "correct": selected.get("correct", False),
                "reason": selected.get("reason", {})
            }

    # ===========================
    # ADVANCE FLOW ALWAYS
    # ===========================
    block = next_block(session)
    session["last"] = block

    return JSONResponse({
        "feedback": feedback,
        "next": format_block(block)
    })


# ===============================
# RELOAD CONTENT
# ===============================
@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"ok": True, "missions": len(MISSIONS)}


# ===============================
# FRONTEND ENTRY
# ===============================
@app.get("/")
def home():
    return FileResponse("static/session.html")
