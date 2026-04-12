from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os
import time

app = FastAPI()

# Asegurar existencia de carpeta static y montar
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# ESTADO INICIAL DEL MOTOR (ESTRUCTURA TVID)
# ==========================================
state = {
    "mental": 100,
    "health": 100,
    "money": 1000,
    "social": 50,
    "discipline": 50,
    "addiction": 0,
    "age": 18.0,
    "difficulty": 1,
    "start_time": 0
}

# Rutas de navegación
@app.get("/")
def read_index():
    return FileResponse("static/session.html")

@app.get("/simulador")
def read_sim():
    return FileResponse("static/jet.html")

# ==========================================
# GESTIÓN DE INICIO (DESPERTAR)
# ==========================================
@app.post("/start")
async def start_life(req: Request):
    global state
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        state["age"] = float(profile.get("age", 18.0))
        state["difficulty"] = int(profile.get("difficulty", 1))
        state["mental"] = 100
        state["health"] = 100
        state["money"] = 1000 if state["difficulty"] == 1 else 500
        state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
        state["social"] = 50
        state["start_time"] = time.time() # Registro para control de 15 min

        return {
            "status": "ready",
            "state": state,
            "next_event": generate_next_event()
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ==========================================
# GENERADOR DE LA VÍA REAL
# ==========================================
def generate_next_event():
    if state["addiction"] > 50: return "tentacion"
    if state["money"] < 200: return "crisis"
    if state["health"] < 40: return "enfermedad"
    if state["mental"] < 30: return "conflicto"
    
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis"]
    return random.choice(events)

# ==========================================
# PROCESADOR TVID (EL JUEZ) CON CURVA DE PRESIÓN
# ==========================================
@app.post("/judge")
async def judge_decision(req: Request):
    global state
    try:
        data = await req.json()
        decision = data.get("decision", "TDM")
        context = data.get("context", "neutral")
        
        # 1. CONTROL DE TIEMPO (Ciclo de 15 Minutos)
        elapsed_seconds = time.time() - state["start_time"]
        
        # Dificultad Progresiva: Aumenta el daño según el reloj (Curva hacia el minuto 7)
        # Multiplicador que va de 1.0 a 2.5 a medida que pasan los 7 minutos
        time_pressure = 1.0 + (min(elapsed_seconds, 420) / 420.0) * 1.5

        if elapsed_seconds > 420: # Pasaron los 7 minutos de acción
            return {"status": "recovery", "state": state}

        # 2. Matriz de Impacto Base
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0}

        if decision == "TDB": # Bien Consciente
            impact["mental"] += 10; impact["addiction"] -= 5; impact["social"] += 5
        elif decision == "TDM": # Miedo / Inacción (Aumenta daño por tiempo)
            impact["mental"] -= 15; impact["addiction"] += 20; impact["health"] -= 5
        elif decision == "TDN": # Niño / Emoción
            impact["social"] += 15; impact["money"] -= 100
        elif decision == "TDP": # Poder / Acción (Frena la crisis)
            impact["money"] += 250; impact["mental"] -= 5; impact["discipline"] = 10
        elif decision == "TDG": # Guerra
            impact["social"] -= 30; impact["health"] -= 20; impact["mental"] += 10

        # 3. Modificadores de Contexto (Enemigos Disparan)
        if context in ["enfermedad", "crisis", "conflicto"]:
            # El daño de estos eventos es potenciado por la presión temporal
            impact["health"] -= 15; impact["money"] -= 100; impact["mental"] -= 10
        elif context == "oportunidad" and decision in ["TDP", "TDB"]:
            impact["money"] += 400; impact["mental"] += 15 # Éxito por astucia

        # 4. Aplicar Dificultad y Presión Temporal
        mult = state["difficulty"] * time_pressure
        for key in impact:
            if impact[key] < 0: impact[key] *= mult

        # 5. Actualización Atómica
        state["mental"] = max(0, min(100, state["mental"] + impact.get("mental", 0)))
        state["health"] = max(0, min(100, state["health"] + impact.get("health", 0)))
        state["money"] = max(0, state["money"] + impact.get("money", 0))
        state["social"] = max(0, min(100, state["social"] + impact.get("social", 0)))
        state["addiction"] = max(0, min(100, state["addiction"] + impact.get("addiction", 0)))
        state["age"] += 0.25 

        # 6. Verificación de Estado
        status = "continue"
        reason = ""
        if state["mental"] <= 0: status = "end"; reason = "quiebra_emocional"
        elif state["health"] <= 0: status = "end"; reason = "muerte_fisica"
        elif state["money"] <= 0 and state["difficulty"] > 1: status = "end"; reason = "insolvencia"
        
        return {
            "status": status,
            "type": reason,
            "state": state,
            "next_event": generate_next_event(),
            "pressure": round(time_pressure, 2),
            "elapsed": int(elapsed_seconds)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
