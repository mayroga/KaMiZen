# ===============================
# KAMIZEN LIFE ENGINE - CORE v4.0
# CINEMATIC + PSYCHOLOGICAL SYSTEM
# ===============================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import sqlite3
import uuid
import time
import os
import json
import random

app = FastAPI()

# ===============================
# STATIC
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = "kamizen.db"

# ===============================
# INIT DB
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
        "health": 100,
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
        },

        "meta": {
            "created": time.time(),
            "phase": 1
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
        psy["stress"] += 6
        psy["control"] -= 4
        state["patterns"]["impulsivity"] += 2

    elif decision in ["TDB", "TDP"]:
        psy["resilience"] += 4
        psy["control"] += 3
        state["patterns"]["consistency"] += 2

    elif decision == "TDN":
        psy["trauma"] += 4
        state["patterns"]["avoidance"] += 2

    elif decision == "TDG":
        psy["control"] += 4
        psy["stress"] += 2

    elif decision == "TDK":
        psy["resilience"] += 3

    # LIMITS
    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    for k in state["patterns"]:
        state["patterns"][k] = max(0, min(100, state["patterns"][k]))

    # IDENTITY
    if psy["stress"] > 75:
        state["identity"]["core"] = "survival"
    elif psy["trauma"] > 65:
        state["identity"]["core"] = "fragmented"
    elif psy["resilience"] > 75:
        state["identity"]["core"] = "stable"
    else:
        state["identity"]["core"] = "neutral"

# ===============================
# 🎬 NARRATIVE ENGINE (REAL)
# ===============================
def generate_narrative(state, decision):

    core = state["identity"]["core"]
    mental = state["mental"]

    if core == "survival":
        return "Sientes presión constante. No decides… reaccionas."

    if core == "fragmented":
        return "Una parte de ti quiere avanzar… otra te detiene."

    if core == "stable":
        return "Empiezas a sentir control real sobre tu vida."

    if mental < 30:
        return "Tu energía mental está baja. Todo pesa más de lo normal."

    if decision == "TDM":
        return "Actuaste por impulso. Algo dentro de ti lo sabe."

    if decision == "TDB":
        return "Elegiste equilibrio. No es fácil, pero es correcto."

    if decision == "TDG":
        return "Tomaste control. Ahora debes sostenerlo."

    return "Cada decisión cambia tu dirección, aunque no lo notes aún."

# ===============================
# EVENT ENGINE
# ===============================
def next_event():

    events = ["tentacion", "crisis", "dinero", "amor", "scene"]
    return random.choice(events)

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

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())
    state = create_state(profile)

    save_user(session_id, state)

    return {
        "session_id": session_id,
        "state": state,
        "narrative": "Tu vida comienza ahora. Nada cambia… hasta que decides.",
        "next_event": "start"
    }

# ===============================
# JUDGE
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

    # EFFECTS
    effects = {
        "TDB": {"mental": 8, "discipline": 5, "karma": 2},
        "TDP": {"money": 40, "discipline": 6, "karma": 3},
        "TDM": {"mental": -10, "karma": -2},
        "TDN": {"social": 6, "karma": 1},
        "TDG": {"mental": 5, "discipline": 4},
        "TDK": {"social": 8, "karma": 2}
    }

    for k, v in effects.get(decision, {}).items():
        state[k] = state.get(k, 0) + v

    # CLAMP
    state["mental"] = max(0, min(100, state["mental"]))
    state["social"] = max(0, min(100, state["social"]))
    state["discipline"] = max(0, min(100, state["discipline"]))

    # UPDATE SYSTEMS
    update_psychology(state, decision)
    save_history(session_id, decision, context)
    save_user(session_id, state)

    # NARRATIVE
    text = generate_narrative(state, decision)

    return {
        "state": state,
        "narrative": text,
        "next_event": next_event()
    }

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
