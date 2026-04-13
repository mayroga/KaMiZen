from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import sqlite3
import uuid
import time
import os
import json

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = "kamizen.db"

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

    c.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        decision TEXT,
        context TEXT,
        timestamp REAL
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
        "money": 500,
        "age": profile.get("age", 18),

        "psychology": {
            "stress": 0,
            "trauma": 0,
            "control": 50,
            "resilience": 50
        },

        "identity": {
            "core": "neutral",
            "archetype": profile.get("emotion", "neutral")
        },

        "patterns": {
            "impulsivity": 0,
            "consistency": 0,
            "avoidance": 0
        }
    }

# ===============================
# DB HELPERS
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


def save_history(session_id, decision, context):

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    INSERT INTO history (session_id, decision, context, timestamp)
    VALUES (?, ?, ?, ?)
    """, (session_id, decision, context, time.time()))

    conn.commit()
    conn.close()

# ===============================
# PSYCHOLOGY ENGINE
# ===============================
def update_psychology(state, decision):

    psy = state["psychology"]

    if decision == "TDM":
        psy["stress"] += 5
        psy["control"] -= 3

    if decision in ["TDB", "TDP"]:
        psy["resilience"] += 2
        psy["control"] += 2

    if decision == "TDN":
        psy["trauma"] += 2

    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    # identity evolution
    if psy["stress"] > 70:
        state["identity"]["core"] = "survival"
    elif psy["trauma"] > 60:
        state["identity"]["core"] = "fragmented"
    elif psy["resilience"] > 70:
        state["identity"]["core"] = "stable"

# ===============================
# ROUTES
# ===============================
@app.get("/")
def home():
    return FileResponse("static/session.html")

@app.get("/simulador")
def sim():
    return FileResponse("static/jet.html")

# ===============================
# START SESSION
# ===============================
@app.post("/start")
async def start(req: Request):

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())

    state = create_state(profile)

    save_user(session_id, state)

    return {
        "session_id": session_id,
        "state": state,
        "narrative": "Sistema iniciado en modo persistente.",
        "next_event": "start"
    }

# ===============================
# GET RANKINGS
# ===============================
@app.get("/rankings")
def rankings():

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT state FROM users")
    rows = c.fetchall()

    conn.close()

    users = []

    for r in rows:
        try:
            s = json.loads(r[0])
            users.append(s)
        except:
            pass

    top_karma = sorted(users, key=lambda x: x.get("karma",0), reverse=True)[:10]
    top_discipline = sorted(users, key=lambda x: x.get("discipline",0), reverse=True)[:10]

    return {
        "top_karma": top_karma,
        "top_discipline": top_discipline
    }

# ===============================
# JUDGE ENGINE
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")
    context = data.get("context", "neutral")

    state = load_user(session_id)

    if not state:
        return JSONResponse({"error": "session not found"}, status_code=404)

    # ===============================
    # APPLY DECISIONS
    # ===============================
    effects = {
        "TDB": {"mental": 8, "discipline": 5, "karma": 2},
        "TDP": {"money": 40, "discipline": 6, "karma": 3},
        "TDM": {"mental": -10, "karma": -2},
        "TDN": {"social": 6, "karma": 1},
        "TDG": {"mental": 5, "discipline": 4},
        "TDK": {"social": 8, "karma": 2}
    }

    e = effects.get(decision, {})

    for k, v in e.items():
        state[k] = state.get(k, 0) + v

    # clamp
    state["mental"] = max(0, min(100, state["mental"]))
    state["social"] = max(0, min(100, state["social"]))
    state["discipline"] = max(0, min(100, state["discipline"]))
    state["karma"] = state.get("karma", 0)

    # psychology
    update_psychology(state, decision)

    # save history
    save_history(session_id, decision, context)

    # save state
    save_user(session_id, state)

    # narrative
    core = state["identity"]["core"]

    if core == "survival":
        text = "Tu mente opera bajo presión constante."
    elif core == "fragmented":
        text = "Tu identidad se divide entre impulsos y control."
    else:
        text = "Tu sistema evoluciona con tus decisiones."

    return {
        "state": state,
        "narrative": text,
        "next_event": "scene"
    }

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
