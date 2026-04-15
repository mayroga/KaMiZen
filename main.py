from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid

app = FastAPI()

# ===============================
# STATIC
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD JSON
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
# HELPERS
# ===============================

def get_first_block(mission):
    return mission["blocks"][0]


def get_next_block(session):
    m = session["mission_index"]
    b = session["block_index"]

    if m >= len(MISSIONS):
        return {"type": "end", "text": {"es": "FIN", "en": "END"}}

    mission = MISSIONS[m]
    blocks = mission["blocks"]

    if b >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0

        if session["mission_index"] >= len(MISSIONS):
            return {"type": "end", "text": {"es": "FIN", "en": "END"}}

        return get_first_block(MISSIONS[session["mission_index"]])

    block = blocks[b]
    session["block_index"] += 1

    return block


def format_block(block):
    """
    NORMALIZA TODO PARA FRONTEND session.html
    """

    out = {
        "type": block.get("type"),
        "text_es": "",
        "text_en": ""
    }

    # TEXT GENERAL
    if "text" in block:
        out["text_es"] = block["text"].get("es", "")
        out["text_en"] = block["text"].get("en", "")

    # GUIDE (breath / riso)
    if "guide" in block:
        out["text_es"] = block["guide"].get("es", out["text_es"])
        out["text_en"] = block["guide"].get("en", out["text_en"])

    # ANALYSIS
    if "analysis" in block:
        out["text_es"] = block["analysis"].get("es", "")
        out["text_en"] = block["analysis"].get("en", "")

    # OPTIONS (TVID)
    if "options" in block:
        out["options"] = []
        for opt in block["options"]:
            out["options"].append({
                "code": opt.get("code"),
                "text": opt.get("text"),
                "correct": opt.get("correct", False)
            })

    # SILENCE
    if block.get("type") == "silence_challenge":
        out["duration_sec"] = block.get("duration_sec", 20)

    return out


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
        "block_index": 0
    }

    first = get_first_block(MISSIONS[0])

    return {
        "session_id": session_id,
        "story": format_block(first)
    }


@app.post("/judge")
def judge(data: dict):
    session_id = data.get("session_id")

    session = sessions.get(session_id)
    if not session:
        return {"story": {"type": "error", "text_es": "Sesión expirada"}}

    next_block = get_next_block(session)

    return {
        "story": format_block(next_block)
    }


@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "ok", "missions": len(MISSIONS)}
