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
# CREAR ESTADO INICIAL
# ===============================
def create_state(profile):
    difficulty = int(profile.get("difficulty", 1))
    emotion = profile.get("emotion", "neutral")
    age = float(profile.get("age", 18))

    return {
        "mental": 100,
        "health": 100,
        "money": 1500 if difficulty == 1 else 800,
        "social": 50,
        "discipline": 50,
        "addiction": 15 if emotion == "stress" else 0,
        "age": age,
        "difficulty": difficulty,
        "start_time": time.time(),
        "last_update": time.time(),
        "is_recovery": False,
        "phase": 1,
        "karma": 0
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
# EVENT GENERATOR (VIVO)
# ===============================
def generate_event(state):

    # eventos críticos primero
    if state["addiction"] > 65:
        return "tentacion"

    if state["money"] < 300:
        return "crisis"

    if state["health"] < 45:
        return "enfermedad"

    if state["mental"] < 35:
        return "conflicto"

    # fase progresiva del sistema
    if state.get("phase", 1) >= 2:
        return random.choice([
            "oportunidad",
            "conflicto",
            "dinero",
            "amor"
        ])

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
            return JSONResponse(status_code=404, content={"error": "session not found"})

        state = sessions[session_id]
        now = time.time()

        # ===============================
        # ANTI-SPAM CONTROL
        # ===============================
        if now - state["last_update"] < 0.15:
            return {
                "status": "cooldown",
                "state": state
            }

        state["last_update"] = now
        elapsed = now - state["start_time"]

        # ===============================
        # RECOVERY MODE (MEDITACIÓN FUTURA)
        # ===============================
        if elapsed > 600:
            state["is_recovery"] = True
            state["phase"] = 3
            return {
                "status": "recovery",
                "state": state
            }

        # ===============================
        # IMPACTO TVID SYSTEM
        # ===============================
        impact = {
            "mental": 0,
            "health": 0,
            "money": 0,
            "social": 0,
            "addiction": 0,
            "discipline": 0,
            "karma": 0
        }

        # ===============================
        # TVID CORE
        # ===============================

        # TDB - Bien
        if decision == "TDB":
            impact["mental"] += 18
            impact["discipline"] += 6
            impact["addiction"] -= 8
            impact["karma"] += 2

        # TDM - Sombra
        elif decision == "TDM":
            impact["mental"] -= 22
            impact["addiction"] += 18
            impact["karma"] -= 3

        # TDN - Niño
        elif decision == "TDN":
            impact["social"] += 18
            impact["money"] -= 120
            impact["karma"] += 1

        # TDP - Padre
        elif decision == "TDP":
            impact["money"] += 350
            impact["discipline"] += 18
            impact["karma"] += 3

        # TDMM - Madre (NUEVO BALANCE)
        elif decision == "TDMM":
            impact["mental"] += 15
            impact["social"] += 10
            impact["addiction"] -= 5
            impact["karma"] += 2

        # TDK - Beso (CONEXIÓN EMOCIONAL)
        elif decision == "TDK":
            impact["mental"] += 10
            impact["social"] += 15
            impact["discipline"] -= 3
            impact["karma"] += 2

        # TDG - Guerra emocional
        elif decision == "TDG":
            impact["health"] -= 15
            impact["mental"] += 10
            impact["discipline"] += 5
            impact["karma"] -= 2

        # ATAQUE EXTERNO
        elif decision == "ataque_enemigo":
            impact["health"] -= 12
            impact["mental"] -= 6
            impact["karma"] -= 1

        # ===============================
        # CONTEXTO DINÁMICO
        # ===============================
        if context in ["crisis", "enfermedad", "conflicto"]:
            if decision not in ["TDB", "TDP", "TDMM"]:
                impact["mental"] -= 10
                impact["money"] -= 80

        if context == "oportunidad":
            if decision in ["TDB", "TDP", "TDMM"]:
                impact["money"] += 450
                impact["karma"] += 1

        # ===============================
        # APLICAR ESTADO
        # ===============================
        for key in impact:
            if key == "money":
                state[key] = max(0, min(999999, state[key] + impact[key]))
            else:
                state[key] = max(0, min(100, state[key] + impact[key]))

        state["age"] += 0.15

        # ===============================
        # EVOLUCIÓN DE FASE
        # ===============================
        if state["karma"] > 10:
            state["phase"] = 2

        if state["karma"] > 25:
            state["phase"] = 3

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
            "next_event": generate_event(state)
        }

    except Exception as e:
        print("ERROR:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
