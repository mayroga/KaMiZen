from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

CONTENT_PATH = os.path.join("static", "kamizen_content.json")

# =========================
# LOAD CONTENT
# =========================
def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("missions", [])
    except Exception as e:
        print("JSON ERROR:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSIONS
# =========================
sessions = {}

def create_session():
    return {
        "m": 0,
        "b": 0,
        "last": None
    }

# =========================
# GET BLOCK SAFE
# =========================
def get_block(s):

    if s["m"] >= len(MISSIONS):
        return None

    mission = MISSIONS[s["m"]]
    blocks = mission.get("blocks", [])

    if s["b"] >= len(blocks):
        return None

    block = blocks[s["b"]]

    key = f"{s['m']}:{s['b']}:{block['type']}"

    if s["last"] == key:
        return None

    s["last"] = key
    return block

# =========================
# ADVANCE ENGINE
# =========================
def advance(s):

    s["b"] += 1

    mission = MISSIONS[s["m"]]
    if s["b"] >= len(mission["blocks"]):
        s["m"] += 1
        s["b"] = 0

    s["last"] = None

# =========================
# FORMAT OUTPUT
# =========================
def format_block(b):

    if not b:
        return {
            "type": "end",
            "text": {
                "en": "SESSION COMPLETE",
                "es": "SESIÓN COMPLETADA"
            }
        }

    out = {"type": b["type"]}

    for k in ["text", "analysis"]:
        if k in b:
            out[k] = b[k]

    if "options" in b:
        out["options"] = b["options"]

    if "duration_sec" in b:
        out["duration_sec"] = b["duration_sec"]

    return out

# =========================
# EVALUATION
# =========================
def evaluate(block, decision):

    if not block or "options" not in block:
        return None

    for o in block["options"]:
        if o["code"] == decision:
            return o

    return None

# =========================
# ROUTES
# =========================
@app.get("/")
def home():
    return FileResponse("static/session.html")

@app.post("/start")
def start():

    sid = str(uuid.uuid4())
    sessions[sid] = create_session()

    s = sessions[sid]
    block = get_block(s)

    return JSONResponse({
        "session_id": sid,
        "story": format_block(block)
    })

@app.post("/judge")
def judge(data: dict):

    sid = data.get("session_id")
    decision = data.get("decision")

    s = sessions.get(sid)

    if not s:
        return {"story": {"type":"error","text":{"en":"Session expired","es":"Sesión expirada"}}}

    block = get_block(s)
    feedback = None

    if decision != "NEXT":
        feedback = evaluate(block, decision)

    if decision == "NEXT" or feedback:
        advance(s)

    next_block = get_block(s)

    return JSONResponse({
        "feedback": feedback,
        "story": format_block(next_block)
    })

@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status":"reloaded","missions":len(MISSIONS)}
