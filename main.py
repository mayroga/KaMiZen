from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os
import time
import uuid

app = FastAPI()

# ===============================
# STATIC FILES
# ===============================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# SESSIONS MEMORY
# ===============================
sessions = {}

# ===============================
# CREATE INITIAL STATE
# ===============================
def create_state(profile):

    difficulty = int(profile.get("difficulty", 1))
    emotion = profile.get("emotion", "neutral")
    age = profile.get("age", 18)

    return {
        # CORE HUMAN STATE
        "mental": 100,
        "health": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": age,
        "difficulty": difficulty,

        # TIMING
        "start_time": time.time(),
        "last_update": time.time(),
        "phase": 1,

        # IDENTITY SYSTEM
        "identity": {
            "core_state": "neutral",
            "emotion": emotion,
            "life_narrative": []
        },

        # PSYCHOLOGY ENGINE
        "psychology": {
            "stress_memory": 0,
            "trauma_index": 0,
            "self_control": 50,
            "resilience": 50
        },

        # PATTERNS
        "patterns": {
            "impulsivity": 0,
            "avoidance": 0,
            "clarity": 0
        },

        "history": []
    }


# ===============================
# KARMA SYSTEM
# ===============================
def update_karma(state):

    k = state["karma"]

    if k >= 100:
        state["powers"] = ["FULL_CONTROL"]
    elif k >= 75:
        state["powers"] = ["PREDICTION"]
    elif k >= 50:
        state["powers"] = ["TIME_SLOW"]
    elif k >= 25:
        state["powers"] = ["SHIELD"]
    else:
        state["powers"] = []


# ===============================
# PSYCHOLOGY ENGINE
# ===============================
def update_psychology(state, decision, context):

    psy = state["psychology"]

    if decision == "TDM":
        psy["stress_memory"] += 4
        psy["self_control"] -= 3

    if decision in ["TDB", "TDP"]:
        psy["self_control"] += 2
        psy["resilience"] += 2

    if decision == "TDN":
        psy["trauma_index"] += 2
        psy["self_control"] -= 2

    if context in ["crisis", "conflict", "tentacion"]:
        psy["stress_memory"] += 2

    # clamp
    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    # identity state
    if psy["stress_memory"] > 75:
        state["identity"]["core_state"] = "colapsando"
    elif psy["trauma_index"] > 65:
        state["identity"]["core_state"] = "fragmentado"
    elif psy["resilience"] > 70:
        state["identity"]["core_state"] = "estable"
    else:
        state["identity"]["core_state"] = "neutral"


# ===============================
# NARRATIVE ENGINE (SESIONES 3–10)
# ===============================
def generate_narrative(state, event, decision):

    core = state["identity"]["core_state"]

    if core == "colapsando":
        return "Tu mente está saturada. Estás reaccionando, no decidiendo."

    if core == "fragmentado":
        return "Tu identidad está dividida en patrones automáticos."

    if event == "tentacion":
        return "Alguien te pide algo. Parece pequeño… pero no lo es."

    if event == "crisis":
        return "La presión externa está activando tu mundo interno."

    if event == "conflict":
        return "Tu reacción definirá el resultado más que el evento."

    if decision == "TDM":
        return "Decidiste desde impulso. El sistema registra consecuencia."

    return "Estás entrenando tu carácter en tiempo real."


# ===============================
# EVENT GENERATOR (BASED ON KAMIZEN CONTENT)
# ===============================
def generate_event(state):

    p = state["patterns"]

    if p["impulsivity"] > 60:
        return "tentacion"

    if p["avoidance"] > 50:
        return "crisis"

    if state["mental"] < 40:
        return "conflict"

    return random.choice([
        "tentacion",
        "crisis",
        "conflict",
        "neutral"
    ])


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
# START SYSTEM
# ===============================
@app.post("/start")
async def start(req: Request):

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())
    state = create_state(profile)

    sessions[session_id] = state

    return {
        "session_id": session_id,
        "state": state,
        "next_event": generate_event(state),
        "narrative": "Sistema activado. Iniciando experiencia humana..."
    }


# ===============================
# JUDGE ENGINE (CORE LOGIC)
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")
    context = data.get("context", "neutral")

    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "session expired"})

    state = sessions[session_id]
    now = time.time()

    # anti spam
    if now - state["last_update"] < 0.12:
        return {"status": "cooldown", "state": state}

    state["last_update"] = now

    # ===============================
    # CORE IMPACTS TVID
    # ===============================
    impacts = {
        "TDB": {"mental": 10, "discipline": 5, "karma": 3},
        "TDP": {"social": 10, "discipline": 8, "karma": 4},
        "TDM": {"mental": -15, "karma": -2},
        "TDN": {"social": 8, "karma": 2},
        "TDG": {"discipline": 10, "mental": 5, "karma": -1},
        "TDK": {"social": 12, "mental": 5, "karma": 4}
    }

    effect = impacts.get(decision, impacts["TDM"])

    for k, v in effect.items():
        state[k] = max(0, min(100, state.get(k, 0) + v))

    # ===============================
    # CONTEXT EFFECTS
    # ===============================
    if context == "crisis" and decision in ["TDM", "TDG"]:
        state["mental"] -= 5

    if context == "tentacion" and decision == "TDM":
        state["mental"] -= 3

    state["age"] += 0.01

    # ===============================
    # HISTORY
    # ===============================
    state["history"].append({
        "decision": decision,
        "context": context,
        "time": now
    })

    state["identity"]["life_narrative"].append(
        f"{decision} frente a {context}"
    )

    # ===============================
    # PATTERNS
    # ===============================
    if decision == "TDM":
        state["patterns"]["impulsivity"] += 2

    if decision in ["TDB", "TDP"]:
        state["patterns"]["clarity"] += 2

    # clamp patterns
    for k in state["patterns"]:
        state["patterns"][k] = max(0, min(100, state["patterns"][k]))

    # ===============================
    # PSYCHOLOGY + KARMA
    # ===============================
    update_psychology(state, decision, context)

    state["karma"] += effect.get("karma", 0)
    update_karma(state)

    # ===============================
    # GAME OVER
    # ===============================
    if state["mental"] <= 0:
        return {"status": "end", "type": "mental_break", "state": state}

    if state["health"] <= 0:
        return {"status": "end", "type": "physical_end", "state": state}

    # ===============================
    # RESPONSE
    # ===============================
    return {
        "status": "continue",
        "state": state,
        "next_event": generate_event(state),
        "narrative": generate_narrative(state, context, decision),
        "karma": state["karma"],
        "phase": state["phase"]
    }


# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
