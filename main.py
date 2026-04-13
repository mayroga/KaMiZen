# ===============================
# KAMIZEN LIFE ENGINE - CINEMATIC CORE v4.0
# STORY-DRIVEN + TVID + PROGRESSION SYSTEM
# ===============================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import sqlite3
import uuid
import time
import os
import json

app = FastAPI()

# ===============================
# STATIC FILES
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = "kamizen.db"
CONTENT_PATH = "static/kamizen_content.json"

# ===============================
# LOAD STORY CONTENT
# ===============================
def load_content():
    if not os.path.exists(CONTENT_PATH):
        return []
    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("sessions", [])

STORIES = load_content()

# ===============================
# INIT DATABASE
# ===============================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        session_id TEXT PRIMARY KEY,
        created REAL,
        state TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ===============================
# CREATE STATE
# ===============================
def create_state(profile):
    return {
        "mental": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": profile.get("age", 18),

        "progress": 0,  # 🔥 CONTROL DE HISTORIA

        "psychology": {
            "stress": 0,
            "trauma": 0,
            "control": 50,
            "resilience": 50
        },

        "identity": {
            "core": "neutral"
        }
    }

# ===============================
# DATABASE HELPERS
# ===============================
def save_user(session_id, state):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    INSERT OR REPLACE INTO users (session_id, created, state)
    VALUES (?, ?, ?)
    """, (session_id, time.time(), json.dumps(state)))

    conn.commit()
    conn.close()

def load_user(session_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT state FROM users WHERE session_id=?", (session_id,))
    row = c.fetchone()

    conn.close()

    if row:
        return json.loads(row[0])
    return None

# ===============================
# PSYCHOLOGY ENGINE
# ===============================
def update_psychology(state, decision):

    psy = state["psychology"]

    if decision == "TDM":
        psy["stress"] += 6
        psy["control"] -= 4

    elif decision in ["TDB", "TDP"]:
        psy["resilience"] += 4
        psy["control"] += 3

    elif decision == "TDN":
        psy["trauma"] += 3

    elif decision == "TDG":
        psy["control"] += 5
        psy["stress"] += 2

    elif decision == "TDK":
        psy["resilience"] += 3

    # LIMITES
    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    # IDENTIDAD
    if psy["stress"] > 70:
        state["identity"]["core"] = "survival"
    elif psy["trauma"] > 60:
        state["identity"]["core"] = "fragmented"
    elif psy["resilience"] > 70:
        state["identity"]["core"] = "stable"
    else:
        state["identity"]["core"] = "neutral"

# ===============================
# GET NEXT STORY
# ===============================
def get_next_story(state):

    index = state.get("progress", 0)

    if index >= len(STORIES):
        return None

    story = STORIES[index]

    # 🔥 avanzar progreso
    state["progress"] += 1

    return story

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
async def start(req: Request):

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())
    state = create_state(profile)

    first_story = get_next_story(state)

    save_user(session_id, state)

    return {
        "session_id": session_id,
        "state": state,
        "story": first_story,
        "end": False
    }

# ===============================
# DECISION ENGINE
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")

    state = load_user(session_id)

    if not state:
        return JSONResponse({"error": "session not found"}, status_code=404)

    # ===============================
    # EFFECTS
    # ===============================
    effects = {
        "TDB": {"mental": 8, "discipline": 5, "karma": 2},
        "TDP": {"discipline": 6, "karma": 3},
        "TDM": {"mental": -10, "karma": -2},
        "TDN": {"social": 6, "karma": 1},
        "TDG": {"mental": 5, "discipline": 4},
        "TDK": {"social": 8, "karma": 2}
    }

    for k, v in effects.get(decision, {}).items():
        state[k] = state.get(k, 0) + v

    # LIMITES
    state["mental"] = max(0, min(100, state["mental"]))
    state["social"] = max(0, min(100, state["social"]))
    state["discipline"] = max(0, min(100, state["discipline"]))

    # PSICOLOGÍA
    update_psychology(state, decision)

    # SIGUIENTE HISTORIA
    next_story = get_next_story(state)

    save_user(session_id, state)

    if not next_story:
        return {
            "state": state,
            "end": True
        }

    return {
        "state": state,
        "story": next_story,
        "end": False
    }

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
