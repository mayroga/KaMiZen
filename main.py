from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()

# =========================
# STATIC FILES
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
# SESSIONS MEMORY (GAME STATE)
# =========================
sessions = {}

# =========================
# SESSION STATE STRUCTURE
# =========================
def create_session():
    return {
        "mission_index": 0,
        "block_index": 0,
        "last_block_key": None,
        "state": {
            "clarity": 50,
            "stress": 50,
            "awareness": 50,
            "emotion": "neutral"
        }
    }

# =========================
# GET CURRENT BLOCK
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


# =========================
# ADVANCE ENGINE (CONTROLADO)
# =========================
def advance(session):
    session["block_index"] += 1

    m = session["mission_index"]
    b = session["block_index"]

    if m < len(MISSIONS):
        blocks = MISSIONS[m].get("blocks", [])

        if b >= len(blocks):
            session["mission_index"] += 1
            session["block_index"] = 0


# =========================
# FORMAT BLOCK SAFE
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

    data = {"type": block.get("type", "unknown")}

    for key in ["text", "analysis", "question"]:
        if key in block:
            data[key] = block[key]

    if "duration_sec" in block:
        data["duration_sec"] = block["duration_sec"]

    if "options" in block:
        data["options"] = []
        for o in block["options"]:
            data["options"].append({
                "code": o.get("code"),
                "text": o.get("text"),
                "correct": o.get("correct", False),
                "reason": o.get("reason", {})
            })

    if "reward" in block:
        data["reward"] = block["reward"]

    return data


# =========================
# ANSWER EVALUATION
# =========================
def evaluate_answer(block, decision):
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
# APPLY GAME STATE EFFECTS
# =========================
def apply_state(session, feedback):
    if not feedback:
        return

    if feedback.get("correct"):
        session["state"]["clarity"] += 5
        session["state"]["awareness"] += 5
        session["state"]["stress"] -= 3
    else:
        session["state"]["stress"] += 5
        session["state"]["clarity"] -= 3


# =========================
# ROUTES
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")


# =========================
# START SESSION
# =========================
@app.post("/start")
def start():

    session_id = str(uuid.uuid4())
    sessions[session_id] = create_session()

    session = sessions[session_id]
    block = get_current_block(session)

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block)
    })


# =========================
# MAIN ENGINE JUDGE
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

    current = get_current_block(session)

    feedback = None
    response = {}

    # =========================
    # EVALUATION
    # =========================
    if decision != "NEXT":
        feedback = evaluate_answer(current, decision)
        apply_state(session, feedback)
        response["feedback"] = feedback

    # =========================
    # ADVANCE ONLY WHEN READY
    # =========================
    if decision == "NEXT":
        advance(session)

    # =========================
    # GET NEXT BLOCK
    # =========================
    next_block = get_current_block(session)

    response["story"] = format_block(next_block)

    return JSONResponse(response)


# =========================
# RELOAD CONTENT
# =========================
@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {
        "status": "reloaded",
        "missions": len(MISSIONS)
    }
