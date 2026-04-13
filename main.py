# ===============================
# KAMIZEN LIFE ENGINE - CINEMATIC CORE v4.1
# STORY-DRIVEN + SYNCHRONIZED FLOW ENGINE
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
# LOAD STORY CONTENT (SAFE)
# ===============================
def load_content():
    if not os.path.exists(CONTENT_PATH):
        return {"sessions": []}

    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data
        except:
            return {"sessions": []}

CONTENT = load_content()
STORIES = CONTENT.get("sessions", [])

# ===============================
# DB INIT
# ===============================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        session_id TEXT PRIMARY KEY,
        created REAL,
        state TEXT,
        story_index INTEGER,
        locked INTEGER DEFAULT 0
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ===============================
# STATE CREATION
# ===============================
def create_state(profile):
    return {
        "mental": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": profile.get("age", 18),

        "progress": 0,
        "story_locked": False,

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
# DB HELPERS
# ===============================
def save_user(session_id, state, index=0, locked=False):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    INSERT OR REPLACE INTO users (session_id, created, state, story_index, locked)
    VALUES (?, ?, ?, ?, ?)
    """, (
        session_id,
        time.time(),
        json.dumps(state),
        index,
        1 if locked else 0
    ))

    conn.commit()
    conn.close()


def load_user(session_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT state, story_index, locked FROM users WHERE session_id=?", (session_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "state": json.loads(row[0]),
        "index": row[1],
        "locked": bool(row[2])
    }

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

    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    if psy["stress"] > 70:
        state["identity"]["core"] = "survival"
    elif psy["trauma"] > 60:
        state["identity"]["core"] = "fragmented"
    elif psy["resilience"] > 70:
        state["identity"]["core"] = "stable"
    else:
        state["identity"]["core"] = "neutral"

# ===============================
# STORY ENGINE (CONTROLLED FLOW)
# ===============================
def get_story(index):
    if index >= len(STORIES):
        return None
    return STORIES[index]

# ===============================
# HOME
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

    story = get_story(0)

    save_user(session_id, state, 0, False)

    return {
        "session_id": session_id,
        "state": state,
        "story": story,
        "story_index": 0,
        "locked": False,
        "end": False
    }

# ===============================
# JUDGE ENGINE (SYNCED FLOW)
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")

    user = load_user(session_id)

    if not user:
        return JSONResponse({"error": "session not found"}, status_code=404)

    state = user["state"]
    index = user["index"]

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

    # LIMITS
    state["mental"] = max(0, min(100, state["mental"]))
    state["social"] = max(0, min(100, state["social"]))
    state["discipline"] = max(0, min(100, state["discipline"]))

    # PSYCHOLOGY
    update_psychology(state, decision)

    # ===============================
    # STORY CONTROL (ONLY ADVANCE HERE)
    # ===============================
    next_index = index + 1
    next_story = get_story(next_index)

    if next_story:
        save_user(session_id, state, next_index, False)
        return {
            "state": state,
            "story": next_story,
            "story_index": next_index,
            "end": False
        }

    save_user(session_id, state, index, True)

    return {
        "state": state,
        "story": None,
        "story_index": index,
        "end": True
    }

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
