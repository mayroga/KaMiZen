from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json

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
            return json.load(f).get("missions", [])
    except Exception as e:
        print("JSON ERROR:", e)
        return []

MISSIONS = load_content()

# ===============================
# SESSIONS
# ===============================
sessions = {}

# ===============================
# CORE FLOW CONTROL
# ===============================

def get_block(session):
    mission = MISSIONS[session["mission"]]
    blocks = mission["blocks"]

    if session["index"] >= len(blocks):
        session["mission"] += 1
        session["index"] = 0

        if session["mission"] >= len(MISSIONS):
            return {"type": "end", "text": {"en": "END", "es": "FIN"}}

        mission = MISSIONS[session["mission"]]
        blocks = mission["blocks"]

    block = blocks[session["index"]]
    session["index"] += 1
    return block


# ===============================
# FORMAT BLOCK (FRONT SAFE)
# ===============================
def format_block(block, lang="en"):
    base = {
        "type": block.get("type"),
        "lang": lang
    }

    # TEXT BLOCKS
    if "text" in block:
        base["text"] = block["text"]

    # STORY / ANALYSIS
    if "analysis" in block:
        base["analysis"] = block["analysis"]

    # BREATH
    if block.get("type") in ["breath_focus", "breathing"]:
        base["duration_sec"] = block.get("duration_sec", 30)
        base["guide"] = block.get("guide", {})

    # TVID / QUIZ
    if block.get("type") == "tvid":
        base["options"] = block.get("options", [])

    # RISO TVID
    if block.get("type") == "riso_tvid":
        base["guide"] = block.get("guide", {})
        base["duration_sec"] = block.get("duration_sec", 30)

    # SILENCE FINAL BLOCK
    if block.get("type") == "silence_challenge":
        base["duration_sec"] = block.get("duration_sec", 20)
        base["reward"] = block.get("reward", {})
        base["type"] = "silence"

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


# ===============================
# START SESSION
# ===============================
@app.post("/start")
def start(data: dict):
    session_id = str(uuid.uuid4())
    lang = data.get("profile", {}).get("lang", "en")

    sessions[session_id] = {
        "mission": 0,
        "index": 0,
        "lang": lang,
        "last_block": None
    }

    block = get_block(sessions[session_id])

    sessions[session_id]["last_block"] = block

    return JSONResponse({
        "session_id": session_id,
        "story": format_block(block, lang)
    })


# ===============================
# JUDGE LOGIC (CONTROL TOTAL)
# ===============================
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

    lang = session["lang"]

    last = session.get("last_block")

    response = {
        "type": "feedback",
        "correct": None,
        "reason": {},
        "next": None
    }

    # =========================
    # IF QUIZ (TVID)
    # =========================
    if last and last.get("type") == "tvid":

        options = last.get("options", [])
        selected = next((o for o in options if o["code"] == decision), None)

        if selected:
            response["correct"] = selected.get("correct", False)
            response["reason"] = selected.get("reason", {})

    # =========================
    # ADVANCE FLOW ALWAYS
    # =========================
    next_block = get_block(session)
    session["last_block"] = next_block

    response["next"] = format_block(next_block, lang)

    return JSONResponse(response)


# ===============================
# RELOAD CONTENT
# ===============================
@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "missions": len(MISSIONS)}
