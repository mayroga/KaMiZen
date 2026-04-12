from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os
import time
import uuid

app = FastAPI()

# ===============================
# CONFIGURACIÓN DE ESTÁTICOS
# ===============================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# MOTOR DE SESIONES
# ===============================
sessions = {}

# ===============================
# GENERADOR DE ESTADO INICIAL
# ===============================
def create_state(profile):
    difficulty = int(profile.get("difficulty", 1))
    emotion = profile.get("emotion", "neutral")
    age = float(profile.get("age", 18))

    return {
        "mental": 100,
        "health": 100,
        "money": 1500 if difficulty == 1 else 600,
        "social": 50,
        "discipline": 40,
        "addiction": 15 if emotion == "stress" else 0,
        "age": age,
        "difficulty": difficulty,
        "start_time": time.time(),
        "last_update": time.time(),
        "is_recovery": False,
        "phase": 1,

        # ===============================
        # KARMA SYSTEM
        # ===============================
        "karma": 0,
        "karma_level": 0,
        "powers": [],
        "meditation_unlocked": False,
        "shield": 0,

        # ===============================
        # FASE 1 — INTELIGENCIA REAL
        # ===============================
        "patterns": {
            "impulsivity": 0,
            "consistency": 0,
            "avoidance": 0,
            "clarity": 0
        },
        "history": []
    }

# ===============================
# KARMA LEVEL SYSTEM
# ===============================
def update_karma(state):
    k = state["karma"]

    if k >= 100:
        state["karma_level"] = 5
        state["powers"] = ["FULL_CONTROL_MODE", "TIME_SLOW", "AUTO_DECISION"]
    elif k >= 75:
        state["karma_level"] = 4
        state["powers"] = ["PREDICTION", "AUTO_RECOVERY"]
    elif k >= 50:
        state["karma_level"] = 3
        state["powers"] = ["TIME_CONTROL", "SHIELD_BOOST"]
    elif k >= 25:
        state["karma_level"] = 2
        state["powers"] = ["AUTO_TDB", "BASIC_SHIELD"]
    elif k >= 10:
        state["karma_level"] = 1
        state["powers"] = ["MENTAL_STABILITY_BOOST"]
    else:
        state["karma_level"] = 0
        state["powers"] = []

# ===============================
# GENERADOR DE EVENTOS DINÁMICOS (FASE 1 PERSONALIZADA)
# ===============================
def generate_event(state):

    p = state.get("patterns", {})

    if p.get("impulsivity", 0) > 60:
        return "tentacion"

    if p.get("avoidance", 0) > 50:
        return "crisis"

    if state["mental"] < 30:
        return "conflicto"

    return random.choice(["dinero", "amor", "oportunidad", "conflicto"])

# ===============================
# RUTAS
# ===============================
@app.get("/")
def index():
    return FileResponse("static/session.html")

@app.get("/simulador")
def sim():
    return FileResponse("static/jet.html")

# ===============================
# START SYSTEM
# ===============================
@app.post("/start")
async def start(req: Request):
    try:
        data = await req.json()
        profile = data.get("profile", {})

        session_id = str(uuid.uuid4())
        state = create_state(profile)

        sessions[session_id] = state

        return {
            "status": "ready",
            "session_id": session_id,
            "state": state,
            "next_event": generate_event(state)
        }

    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ===============================
# JUEZ TVID ENGINE
# ===============================
@app.post("/judge")
async def judge(req: Request):
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDM")
        context = data.get("context", "neutral")

        if session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Session expired"})

        state = sessions[session_id]
        now = time.time()

        # ANTI-SPAM
        if now - state["last_update"] < 0.15:
            return {"status": "cooldown", "state": state}

        state["last_update"] = now
        elapsed = now - state["start_time"]

        # ===============================
        # FASES
        # ===============================
        if elapsed > 720:
            state["phase"] = 4
        elif elapsed > 420:
            state["phase"] = 3
            state["is_recovery"] = True
            state["meditation_unlocked"] = True
        elif elapsed > 180:
            state["phase"] = 2

        # ===============================
        # TVID IMPACT
        # ===============================
        impacts = {
            "TDB": {"mental": 18, "discipline": 10, "addiction": -8, "karma": 3},
            "TDP": {"money": 350, "discipline": 18, "mental": -5, "karma": 4},
            "TDM": {"mental": -22, "addiction": 18, "karma": -3},
            "TDMM": {"health": 12, "mental": 15, "social": 10, "karma": 3},
            "TDK": {"social": 20, "mental": 10, "karma": 4},
            "TDG": {"discipline": 20, "health": -15, "mental": 10, "karma": -2},
            "TDN": {"social": 18, "money": -120, "mental": 10, "karma": 2},
            "ataque_enemigo": {"health": -12, "mental": -6, "karma": -1}
        }

        res = impacts.get(decision, impacts["TDM"])

        # APPLY IMPACT
        for key, val in res.items():
            if key == "money":
                state[key] = max(0, min(999999, state[key] + val))
            else:
                state[key] = max(0, min(100, state.get(key, 0) + val))

        # CONTEXT
        if context in ["crisis", "enfermedad", "conflicto"]:
            if decision not in ["TDB", "TDP", "TDMM"]:
                state["mental"] -= 10
                state["money"] -= 80

        if context == "oportunidad":
            if decision in ["TDB", "TDP", "TDMM"]:
                state["money"] += 450
                state["karma"] += 2

        state["age"] += 0.15

        # ===============================
        # DETECCIÓN DE PATRONES (NUEVO)
        # ===============================
        state["history"].append({
            "decision": decision,
            "context": context,
            "time": now
        })

        if decision == "TDM":
            state["patterns"]["impulsivity"] += 2

        if decision in ["TDB", "TDP"]:
            state["patterns"]["clarity"] += 2
            state["patterns"]["consistency"] += 1

        if decision == "TDN":
            state["patterns"]["avoidance"] += 1

        # NORMALIZAR
        for k in state["patterns"]:
            state["patterns"][k] = max(0, min(100, state["patterns"][k]))

        # ===============================
        # KARMA UPDATE
        # ===============================
        update_karma(state)

        # SHIELD SYSTEM
        if "BASIC_SHIELD" in state["powers"]:
            state["shield"] = min(100, state["shield"] + 2)

        # ===============================
        # GAME OVER
        # ===============================
        if state["mental"] <= 0:
            return {"status": "end", "type": "colapso_mental", "state": state}

        if state["health"] <= 0:
            return {"status": "end", "type": "muerte_fisica", "state": state}

        # ===============================
        # RESPONSE FINAL
        # ===============================
        return {
            "status": "continue",
            "state": state,
            "phase_alert": state["phase"],
            "karma_level": state["karma_level"],
            "powers": state["powers"],
            "next_event": generate_event(state)
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
