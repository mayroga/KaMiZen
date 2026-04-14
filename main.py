from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import json
import os

app = FastAPI()

# ===============================
# STATIC
# ===============================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# LOAD DATABASE SAFE
# ===============================
CONTENT = []

def load_content():
    global CONTENT
    try:
        path = "static/kamizen_content.json"

        if not os.path.exists(path):
            print("[WARN] No JSON found")
            CONTENT = []
            return

        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        CONTENT = raw.get("missions", []) if isinstance(raw, dict) else raw

        print(f"[OK] Missions loaded: {len(CONTENT)}")

    except Exception as e:
        print("[ERROR] JSON LOAD FAIL:", e)
        CONTENT = []

load_content()

# ===============================
# SESSIONS
# ===============================
sessions = {}

# ===============================
# STATE
# ===============================
def create_state():
    return {
        "mission": 0,
        "block": 0,
        "last": time.time(),
        "history": []
    }

# ===============================
# SAFE GET CURRENT BLOCK
# ===============================
def get_current(state):
    try:
        mission = CONTENT[state["mission"]]
        block = mission["blocks"][state["block"]]
        return mission, block
    except:
        state["mission"] = 0
        state["block"] = 0
        return CONTENT[0], CONTENT[0]["blocks"][0]

# ===============================
# FORMAT FRONTEND SAFE
# ===============================
def format_block(mission, block):

    text = block.get("text", {})

    if isinstance(text, str):
        text_es = text
        text_en = text
    else:
        text_es = text.get("es") or text.get("en") or "..."
        text_en = text.get("en") or text_es

    options = []

    for opt in block.get("options", []):
        t = opt.get("text", {})
        options.append({
            "code": opt.get("code", "TDB"),
            "text": {
                "es": t.get("es", "CONTINUAR"),
                "en": t.get("en", "CONTINUE")
            }
        })

    return {
        "type": block.get("type", "story"),
        "text_es": text_es,
        "text_en": text_en,
        "options": options,
        "duration_sec": block.get("duration_sec", 0)
    }

# ===============================
# APPLY PROGRESSION
# ===============================
def next_step(state):

    state["block"] += 1

    if state["mission"] >= len(CONTENT):
        state["mission"] = 0
        state["block"] = 0
        return

    mission = CONTENT[state["mission"]]

    if state["block"] >= len(mission["blocks"]):
        state["mission"] += 1
        state["block"] = 0

    if state["mission"] >= len(CONTENT):
        state["mission"] = 0
        state["block"] = 0

# ===============================
# ROUTES
# ===============================

@app.get("/")
def home():
    return FileResponse("static/session.html")

# ===============================
# START
# ===============================
@app.post("/start")
async def start(req: Request):

    try:
        data = await req.json()

        sid = str(uuid.uuid4())
        state = create_state()

        sessions[sid] = state

        mission, block = get_current(state)

        return {
            "session_id": sid,
            "story": format_block(mission, block)
        }

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ===============================
# JUDGE
# ===============================
@app.post("/judge")
async def judge(req: Request):

    try:
        data = await req.json()

        sid = data.get("session_id")
        decision = data.get("decision")

        if sid not in sessions:
            return JSONResponse({"error": "SESSION LOST"}, status_code=404)

        state = sessions[sid]

        # anti spam
        if time.time() - state["last"] < 0.05:
            mission, block = get_current(state)
            return {"story": format_block(mission, block)}

        state["last"] = time.time()

        # progression
        next_step(state)

        mission, block = get_current(state)

        state["history"].append({
            "mission": state["mission"],
            "block": state["block"]
        })

        return {
            "story": format_block(mission, block),
            "state": state
        }

    except Exception as e:
        print("[ERROR]", e)
        return JSONResponse({"error": "RECOVERY"}, status_code=500)

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
