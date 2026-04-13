# ===============================
# KAMIZEN LIFE ENGINE - FULL CORE v3.3
# PERSISTENT PSYCHOLOGICAL SIMULATOR
# FASTAPI + SQLITE + NARRATIVE ENGINE
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
# STATE CREATION ENGINE
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
            "archetype": profile.get("emotion", "neutral"),
            "narrative": []
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
# PSYCHOLOGY ENGINE (TVID CORE EVOLUTION)
# ===============================
def update_psychology(state, decision):

    psy = state["psychology"]

    # ===============================
    # DECISION IMPACTS
    # ===============================
    if decision == "TDM":
        psy["stress"] += 6
        psy["control"] -= 4
        state["patterns"]["impulsivity"] += 2

    if decision in ["TDB", "TDP"]:
        psy["resilience"] += 3
        psy["control"] += 2
        state["patterns"]["consistency"] += 2

    if decision == "TDN":
        psy["trauma"] += 3
        state["patterns"]["avoidance"] += 2

    if decision == "TDG":
        psy["control"] += 3
        psy["stress"] += 2

    if decision == "TDK":
        psy["resilience"] += 2

    # ===============================
    # CLAMP VALUES
    # ===============================
    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    for k in state["patterns"]:
        state["patterns"][k] = max(0, min(100, state["patterns"][k]))

    # ===============================
    # IDENTITY EVOLUTION SYSTEM
    # ===============================
    if psy["stress"] > 75:
        state["identity"]["core"] = "survival"

    elif psy["trauma"] > 65:
        state["identity"]["core"] = "fragmented"

    elif psy["resilience"] > 75:
        state["identity"]["core"] = "stable"

    else:
        state["identity"]["core"] = "neutral"

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
        "narrative": "KAMIZEN system initialized. Life simulation active.",
        "next_event": "start"
    }

# ===============================
# RANKINGS SYSTEM
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
            users.append(json.loads(r[0]))
        except:
            pass

    return {
        "top_karma": sorted(users, key=lambda x: x.get("karma",0), reverse=True)[:10],
        "top_discipline": sorted(users, key=lambda x: x.get("discipline",0), reverse=True)[:10],
        "top_mental": sorted(users, key=lambda x: x.get("mental",0), reverse=True)[:10]
    }

# ===============================
# JUDGE ENGINE (CORE SIMULATION)
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
    # GLOBAL EFFECTS
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

    # ===============================
    # CLAMP CORE VALUES
    # ===============================
    state["mental"] = max(0, min(100, state.get("mental", 100)))
    state["social"] = max(0, min(100, state.get("social", 50)))
    state["discipline"] = max(0, min(100, state.get("discipline", 50)))
    state["karma"] = state.get("karma", 0)

    # ===============================
    # PSYCHOLOGY UPDATE
    # ===============================
    update_psychology(state, decision)

    # ===============================
    # HISTORY LOG
    # ===============================
    save_history(session_id, decision, context)

    # ===============================
    # SAVE STATE
    # ===============================
    save_user(session_id, state)

    # ===============================
    # NARRATIVE ENGINE
    # ===============================
    core = state["identity"]["core"]

    if core == "survival":
        text = "Your mind operates under constant pressure."
    elif core == "fragmented":
        text = "Your identity splits between impulse and control."
    elif core == "stable":
        text = "Your system shows increasing coherence and stability."
    else:
        text = "Your system evolves through each decision."

    # ===============================
    # RESPONSE
    # ===============================
    return {
        "state": state,
        "narrative": text,
        "next_event": "scene"
    }

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
