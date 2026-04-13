from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os
import json

app = FastAPI()

# ===============================
# STATIC
# ===============================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD CONTENT
# ===============================
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    CONTENT = json.load(f)["missions"]

# ===============================
# SESSIONS
# ===============================
sessions = {}

# ===============================
# STATE
# ===============================
def create_state(profile):
    return {
        "mental": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": profile.get("age", 18),

        "mission_index": 0,
        "block_index": 0,

        "last_update": time.time(),
        "history": []
    }

# ===============================
# IMPACT SYSTEM
# ===============================
IMPACTS = {
    "TDB": {"mental": 5, "discipline": 2, "karma": 1},
    "TDP": {"social": 5, "discipline": 3, "karma": 1},
    "TDM": {"mental": -6, "karma": -1},
    "TDN": {"social": 4, "karma": 1},
    "TDG": {"discipline": 4, "mental": 2, "karma": 0},
    "TDK": {"social": 6, "mental": 1, "karma": 1}
}

# ===============================
# APPLY IMPACTS
# ===============================
def apply(state, decision):
    effect = IMPACTS.get(decision, IMPACTS["TDM"])

    for k, v in effect.items():
        state[k] = max(0, min(100, state[k] + v))

# ===============================
# RESET FLOW (ONLY WHEN FINISHED ALL MISSIONS)
# ===============================
def reset_if_needed(state):
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0
        state["block_index"] = 0

# ===============================
# GET CURRENT BLOCK SAFE
# ===============================
def get_current_block(state):

    reset_if_needed(state)

    mission = CONTENT[state["mission_index"]]
    blocks = mission["blocks"]

    if state["block_index"] >= len(blocks):
        state["mission_index"] += 1
        state["block_index"] = 0

        reset_if_needed(state)

        mission = CONTENT[state["mission_index"]]
        blocks = mission["blocks"]

    block = blocks[state["block_index"]]

    return mission, block

# ===============================
# TEXT EXTRACTOR
# ===============================
def extract_text(block):

    text = block.get("text", "")

    if isinstance(text, dict):
        return text.get("es") or text.get("en") or ""

    return str(text)

# ===============================
# START SESSION
# ===============================
@app.post("/start")
async def start(req: Request):

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())
    state = create_state(profile)

    sessions[session_id] = state

    mission, block = get_current_block(state)

    return {
        "session_id": session_id,
        "state": state,
        "story": {
            "mission_id": mission["id"],
            "level": mission["level"],
            "category": mission["category"],
            "blocks": [block],
            "text": extract_text(block)
        }
    }

# ===============================
# JUDGE ENGINE
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")

    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "session expired"})

    state = sessions[session_id]

    # COOLDOWN ANTI-SPAM
    now = time.time()
    if now - state["last_update"] < 0.10:
        return {"status": "cooldown", "state": state}

    state["last_update"] = now

    # APPLY EFFECTS
    apply(state, decision)

    # SAVE HISTORY
    state["history"].append({
        "decision": decision,
        "time": now
    })

    # ADVANCE STORY
    state["block_index"] += 1

    mission, block = get_current_block(state)

    # RESPONSE CLEAN
    return {
        "status": "continue",
        "state": state,
        "story": {
            "mission_id": mission["id"],
            "level": mission["level"],
            "category": mission["category"],
            "blocks": [block],
            "text": extract_text(block)
        }
    }

# ===============================
# HOME
# ===============================
@app.get("/")
def home():
    return FileResponse("static/session.html")

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
