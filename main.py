from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os
import time
import uuid

app = FastAPI()

# ===============================
# STATIC
# ===============================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# SESIONES
# ===============================
sessions = {}

# ===============================
# ESTADO INICIAL
# ===============================
def create_state(profile):
    diff = int(profile.get("difficulty", 1))
    emotion = profile.get("emotion", "neutral")

    return {
        "mental": 100,
        "health": 100,
        "money": 1500 if diff == 1 else 600,
        "social": 50,
        "discipline": 40,
        "addiction": 15 if emotion == "stress" else 0,
        "karma": 0,
        "phase": 1,
        "age": float(profile.get("age", 18)),
        "difficulty": diff,
        "start_time": time.time(),
        "last_update": time.time(),
        "is_recovery": False
    }

# ===============================
# ROUTES
# ===============================
@app.get("/")
def index():
    return FileResponse("static/session.html")

@app.get("/simulador")
def sim():
    return FileResponse("static/jet.html")

# ===============================
# START
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
# EVENT GENERATOR
# ===============================
def generate_event(state):

    if state["addiction"] > 65:
        return "tentacion"

    if state["money"] < 300:
        return "crisis"

    if state["health"] < 45:
        return "enfermedad"

    if state["mental"] < 35:
        return "conflicto"

    if state.get("phase", 1) >= 3:
        return random.choice(["oportunidad", "conflicto", "amor", "dinero"])

    return random.choice([
        "dinero",
        "amor",
        "oportunidad",
        "conflicto",
        "enfermedad",
        "crisis",
        "tentacion"
    ])

# ===============================
# JUEZ TVID + FASE SYSTEM
# ===============================
@app.post("/judge")
async def judge(req: Request):
    try:
        data = await req.json()

        session_id = data.get("session_id")
        decision = data.get("decision", "TDM")
        context = data.get("context", "neutral")

        if session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "session not found"})

        state = sessions[session_id]
        now = time.time()
        elapsed = now - state["start_time"]

        # ===============================
        # CONTROL ANTI-SPAM
        # ===============================
        if now - state["last_update"] < 0.15:
            return {"status": "cooldown", "state": state}

        state["last_update"] = now

        # ===============================
        # FASES POR TIEMPO (MEDICIÓN REAL)
        # ===============================
        if elapsed > 720:
            state["phase"] = 4   # Renacimiento
        elif elapsed > 420:
            state["phase"] = 3   # Meditación
        elif elapsed > 180:
            state["phase"] = 2   # Crisis

        # ===============================
        # IMPACTO TVID SYSTEM
        # ===============================
        impact = {
            "mental": 0,
            "health": 0,
            "money": 0,
            "social": 0,
            "discipline": 0,
            "addiction": 0,
            "karma": 0
        }

        # TVID CORE
        if decision == "TDB":
            impact["mental"] += 15
            impact["discipline"] += 10
            impact["karma"] += 2

        elif decision == "TDM":
            impact["mental"] -= 20
            impact["addiction"] += 15
            impact["karma"] -= 3

        elif decision == "TDN":
            impact["social"] += 15
            impact["money"] -= 50
            impact["karma"] += 1

        elif decision == "TDP":
            impact["money"] += 200
            impact["discipline"] += 15
            impact["karma"] += 3

        elif decision == "TDMM":
            impact["mental"] += 15
            impact["social"] += 10
            impact["health"] += 10
            impact["karma"] += 2

        elif decision == "TDK":
            impact["social"] += 20
            impact["mental"] += 10
            impact["karma"] += 3

        elif decision == "TDG":
            impact["discipline"] += 20
            impact["health"] -= 10
            impact["mental"] += 5
            impact["karma"] -= 2

        elif decision == "ataque_enemigo":
            impact["health"] -= 12
            impact["mental"] -= 6
            impact["karma"] -= 1

        # ===============================
        # CONTEXTO
        # ===============================
        if context in ["crisis", "conflicto", "enfermedad"]:
            if decision not in ["TDB", "TDP", "TDMM"]:
                impact["mental"] -= 10
                impact["money"] -= 80

        if context == "oportunidad":
            if decision in ["TDB", "TDP", "TDMM"]:
                impact["money"] += 300
                impact["karma"] += 1

        # ===============================
        # APLICAR ESTADO
        # ===============================
        for k, v in impact.items():
            if k == "money":
                state[k] = max(0, min(999999, state[k] + v))
            else:
                state[k] = max(0, min(100, state[k] + v))

        state["age"] += 0.15

        # ===============================
        # EVOLUCIÓN DE FASE POR KARMA
        # ===============================
        if state["karma"] > 10:
            state["phase"] = max(state["phase"], 2)

        if state["karma"] > 25:
            state["phase"] = max(state["phase"], 3)

        # ===============================
        # GAME OVER
        # ===============================
        if state["mental"] <= 0:
            return {
                "status": "end",
                "type": "colapso_mental",
                "state": state
            }

        if state["health"] <= 0:
            return {
                "status": "end",
                "type": "muerte_fisica",
                "state": state
            }

        # ===============================
        # RESPUESTA FINAL
        # ===============================
        return {
            "status": "continue",
            "state": state,
            "phase_alert": state["phase"],
            "next_event": "meditacion_obligatoria" if state["phase"] == 3
            else generate_event(state)
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
