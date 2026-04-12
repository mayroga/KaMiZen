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
        "karma": 0
    }

# ===============================
# GENERADOR DE EVENTOS DINÁMICOS
# ===============================
def generate_event(state):
    # Eventos Críticos (Prioridad por estado)
    if state["addiction"] > 65: return "tentacion"
    if state["money"] < 300: return "crisis"
    if state["health"] < 45: return "enfermedad"
    if state["mental"] < 35: return "conflicto"

    # Eventos según Fase del Sistema
    if state["phase"] == 3: return "meditacion_obligatoria"
    
    if state["phase"] >= 2:
        return random.choice(["oportunidad", "conflicto", "dinero", "amor"])

    return random.choice(["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis", "tentacion"])

# ===============================
# RUTAS DE INTERFAZ
# ===============================
@app.get("/")
def index():
    return FileResponse("static/session.html")

@app.get("/simulador")
def sim():
    return FileResponse("static/jet.html")

# ===============================
# CONTROLADOR DE INICIO
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
# JUEZ TVID ENGINE (CORE DEL SISTEMA)
# ===============================
@app.post("/judge")
async def judge(req: Request):
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDM") # Default a Sombra si no hay decisión
        context = data.get("context", "neutral")

        if session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Session expired"})

        state = sessions[session_id]
        now = time.time()
        
        # Anti-Spam
        if now - state["last_update"] < 0.15:
            return {"status": "cooldown", "state": state}

        state["last_update"] = now
        elapsed = now - state["start_time"]

        # --- LÓGICA DE FASES CRONOLÓGICAS ---
        if elapsed > 720: 
            state["phase"] = 4 # Renacimiento
        elif elapsed > 420: 
            state["phase"] = 3 # Meditación Consciente
            state["is_recovery"] = True
        elif elapsed > 180: 
            state["phase"] = 2 # Crisis

        # --- IMPACTO TVID (EL ALMA DEL SISTEMA) ---
        impacts = {
            "TDB":  {"mental": 18, "discipline": 10, "addiction": -8, "karma": 2},  # Bien
            "TDP":  {"money": 350, "discipline": 18, "mental": -5, "karma": 3},    # Padre
            "TDM":  {"mental": -22, "discipline": -10, "addiction": 18, "karma": -3}, # Sombra
            "TDMM": {"health": 12, "mental": 15, "social": 10, "karma": 2},        # Madre
            "TDK":  {"social": 20, "mental": 10, "discipline": -3, "karma": 2},    # Beso
            "TDG":  {"discipline": 20, "health": -15, "mental": 10, "karma": -2},  # Guerra
            "TDN":  {"social": 18, "money": -120, "mental": 10, "karma": 1},       # Niño
            "ataque_enemigo": {"health": -12, "mental": -6, "karma": -1}
        }

        res = impacts.get(decision, impacts["TDM"])
        
        # --- APLICAR IMPACTO ---
        for key, val in res.items():
            if key == "money":
                state[key] = max(0, min(999999, state[key] + val))
            else:
                state[key] = max(0, min(100, state.get(key, 0) + val))

        # --- CONTEXTO DINÁMICO ---
        if context in ["crisis", "enfermedad", "conflicto"] and decision not in ["TDB", "TDP", "TDMM"]:
            state["mental"] -= 10
            state["money"] -= 80

        if context == "oportunidad" and decision in ["TDB", "TDP", "TDMM"]:
            state["money"] += 450
            state["karma"] += 1

        state["age"] += 0.15

        # --- REVISIÓN DE GAME OVER ---
        if state["mental"] <= 0: return {"status": "end", "type": "colapso_mental", "state": state}
        if state["health"] <= 0: return {"status": "end", "type": "muerte_fisica", "state": state}

        return {
            "status": "continue",
            "state": state,
            "phase_alert": state["phase"],
            "next_event": generate_event(state)
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===============================
# LANZAMIENTO
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
