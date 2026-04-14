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
# DATABASE LOAD (KAMIZEN)
# ===============================
CONTENT = []

try:
    path = "static/kamizen_content.json"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

            if isinstance(data, dict) and "missions" in data:
                CONTENT = data["missions"]
            elif isinstance(data, list):
                CONTENT = data
            else:
                CONTENT = []

        print(f"[OK] KAMIZEN LOADED: {len(CONTENT)} missions")
    else:
        print("[WARN] kamizen_content.json not found")
except Exception as e:
    print(f"[ERROR] DB LOAD FAILED: {e}")

# ===============================
# SESSIONS MEMORY
# ===============================
sessions = {}

# ===============================
# INITIAL STATE
# ===============================
def create_initial_state(profile):
    return {
        "mental": 100,
        "social": 100,
        "discipline": 100,
        "karma": 0,
        "mission_index": 0,
        "block_index": 0,
        "last_update": time.time(),
        "history": [],
        "lang": profile.get("lang", "es")
    }

# ===============================
# IMPACT SYSTEM (TVID + CONTROL)
# ===============================
IMPACTS = {
    "TDB": {"mental": 2, "discipline": 3},
    "TDP": {"mental": 5, "discipline": 8, "karma": 2},
    "TDM": {"mental": -12, "discipline": -20, "karma": -5},  # castigo fuerte
    "TDN": {"mental": 6, "social": 5},
    "TDG": {"discipline": 10, "mental": 3, "social": -3},
    "TDK": {"social": 12, "karma": 8, "mental": 4},
    "CORRECT": {"mental": 10, "discipline": 10},
    "WRONG": {"mental": -10, "discipline": -8}
}

# ===============================
# APPLY PROGRESSION
# ===============================
def apply_progression(state, decision):

    if not CONTENT:
        return

    effect = IMPACTS.get(decision, IMPACTS["TDB"])

    for k, v in effect.items():
        if k in state:
            state[k] = max(0, min(100, state[k] + v))

    try:
        mission = CONTENT[state["mission_index"]]
        blocks = mission.get("blocks", [])

        state["block_index"] += 1

        # siguiente misión
        if state["block_index"] >= len(blocks):
            state["mission_index"] += 1
            state["block_index"] = 0

        # loop infinito seguro
        if state["mission_index"] >= len(CONTENT):
            state["mission_index"] = 0
            state["block_index"] = 0

    except Exception:
        state["mission_index"] = 0
        state["block_index"] = 0

# ===============================
# FORMAT RESPONSE
# ===============================
def format_block_response(mission, block):

    text = block.get("text") or block.get("question") or {}

    if isinstance(text, str):
        text_es = text
        text_en = text
    else:
        text_es = text.get("es") or text.get("en") or "..."
        text_en = text.get("en") or text_es

    options = []

    for opt in block.get("options", []):
        t = opt.get("text", {})
        es = t.get("es") or t.get("en") or "CONTINUAR"
        en = t.get("en") or es

        options.append({
            "code": opt.get("code", "TDB"),
            "text": {"es": es, "en": en}
        })

    if not options and block.get("type") not in ["breathing", "silence_challenge"]:
        options = [{"code": "TDB", "text": {"es": "CONTINUAR", "en": "CONTINUE"}}]

    response = {
        "type": block.get("type", "story"),
        "category": mission.get("category", "KAMIZEN"),
        "text_es": text_es,
        "text_en": text_en,
        "duration_sec": block.get("duration_sec", 0),
        "options": options,
        "silence": block.get("silence", None),
        "breathing": block.get("breathing", None)
    }

    if block.get("type") == "riddle":
        ans = block.get("answer", {})
        ins = block.get("insight", {})

        response["answer"] = {
            "es": ans.get("es", ""),
            "en": ans.get("en", "")
        }

        response["insight"] = {
            "es": ins.get("es", ""),
            "en": ins.get("en", "")
        }

    return response

# ===============================
# ROUTES
# ===============================

@app.get("/")
def home():
    return FileResponse("static/session.html")

# -------------------------------
# START SESSION
# -------------------------------
@app.post("/start")
async def start(req: Request):
    try:
        data = await req.json()

        session_id = str(uuid.uuid4())
        state = create_initial_state(data.get("profile", {}))

        sessions[session_id] = state

        if not CONTENT:
            return JSONResponse({"error": "NO_CONTENT"}, status_code=500)

        mission = CONTENT[0]
        block = mission["blocks"][0]

        return {
            "session_id": session_id,
            "state": state,
            "story": format_block_response(mission, block)
        }

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# -------------------------------
# JUDGE DECISION
# -------------------------------
@app.post("/judge")
async def judge(req: Request):
    try:
        data = await req.json()

        sid = data.get("session_id")
        decision = data.get("decision", "TDB")

        if sid not in sessions:
            return JSONResponse({"error": "SESSION_EXPIRED"}, status_code=404)

        state = sessions[sid]

        now = time.time()
        if now - state["last_update"] < 0.08:
            return {"status": "cooldown", "state": state}

        state["last_update"] = now

        apply_progression(state, decision)

        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]

        return {
            "status": "ok",
            "state": state,
            "story": format_block_response(mission, block)
        }

    except Exception as e:
        print("[ERROR /judge]", e)
        return JSONResponse({"error": "RECOVERY_MODE"}, status_code=500)

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
