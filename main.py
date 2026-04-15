from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid

app = FastAPI()

# =========================
# STATIC
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# LOAD CONTENT
# =========================
CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("missions", [])
    except Exception as e:
        print("ERROR LOAD JSON:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSIONS MEMORY
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
    i = session["block_index"]

    if i >= len(blocks):
        return None

    return blocks[i]


def advance(session):
    session["block_index"] += 1

    blocks = get_blocks(session)

    if session["block_index"] >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0


def format_block(block):
    if not block:
        return None

    base = {
        "type": block.get("type")
    }

    # TEXT / ANALYSIS
    if "text" in block:
        base["text"] = block["text"]

    if "analysis" in block:
        base["analysis"] = block["analysis"]

    # BREATH
    if block.get("type") in ["breath_focus", "breathing"]:
        base["duration_sec"] = block.get("duration_sec", 30)
        base["guide"] = block.get("guide", {})

    # TVID / QUIZ
    if "options" in block:
        base["options"] = []
        for o in block["options"]:
            base["options"].append({
                "code": o.get("code"),
                "text": o.get("text"),
                "correct": o.get("correct", False),
                "reason": o.get("reason", {})
            })

    # SILENCE
    if block.get("type") == "silence_challenge":
        base["duration_sec"] = block.get("duration_sec", 20)
        base["reward"] = block.get("reward", {})

    # QUESTION
    if "question" in block:
        base["question"] = block["question"]

    return base


def evaluate_answer(block, decision):
    """
    Solo aplica a TVID / QUIZ
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
def start(data: dict = None):

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

    if not session:
        return JSONResponse({
            "story": {
                "type": "error",
                "text": {"en": "Session expired", "es": "Sesión expirada"}
            }
        })

    current = get_current_block(session)

    feedback = evaluate_answer(current, decision)

    # SOLO feedback si es TVID
    response = {}

    if feedback:
        response["feedback"] = feedback

    # avanzar flujo SIEMPRE
    advance(session)

    next_block = get_current_block(session)

    # si terminó misión
    if next_block is None:
        response["story"] = {
            "type": "end",
            "text": {
                "en": "SESSION COMPLETE",
                "es": "SESIÓN COMPLETADA"
            }
        }
    else:
        response["story"] = format_block(next_block)

    return JSONResponse(response)


@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "missions": len(MISSIONS)}
