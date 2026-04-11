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
    "start_time": 0,
    "is_recovery": False
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
        
        # Reinicio de estado para nueva sesión
        state["age"] = float(profile.get("age", 18.0))
        state["difficulty"] = int(profile.get("difficulty", 1))
        state["mental"] = 100
        state["health"] = 100
        state["money"] = 1000 if state["difficulty"] == 1 else 500
        state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
        state["social"] = 50
        state["discipline"] = 50
        state["is_recovery"] = False
        state["start_time"] = time.time() # Registro para control de 15 min (7 acción + 8 calma)

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
    # Lógica de prioridad según estado crítico
    if state["addiction"] > 60: return "tentacion"
    if state["money"] < 200: return "crisis"
    if state["health"] < 40: return "enfermedad"
    if state["mental"] < 30: return "conflicto"
    
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis", "tentacion"]
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
        
        # Si ya pasaron 7 minutos (420 seg), activar fase de recuperación (8 min restantes)
        if elapsed_seconds > 420:
            state["is_recovery"] = True
            return {
                "status": "recovery", 
                "state": state,
                "message": "Fase de Acción terminada. Iniciando Recuperación Neural."
            }

        # Dificultad Progresiva: Multiplicador que escala de 1.0 a 3.0 hacia el minuto 7
        time_pressure = 1.0 + (min(elapsed_seconds, 420) / 420.0) * 2.0

        # 2. Matriz de Impacto Base (Diferencial de variables)
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0, "discipline": 0}

        # Lógica de Botones TVID
        if decision == "TDB": # Bien Consciente
            impact["mental"] += 12; impact["addiction"] -= 10; impact["social"] += 8; impact["discipline"] += 5
        elif decision == "TDM": # Miedo / Inacción (El más dañino)
            impact["mental"] -= 20; impact["addiction"] += 15; impact["health"] -= 10; impact["discipline"] -= 10
        elif decision == "TDN": # Niño / Emoción (Gasto impulsivo)
            impact["social"] += 15; impact["money"] -= 150; impact["discipline"] -= 5
        elif decision == "TDP": # Poder / Acción (Genera riqueza, consume energía)
            impact["money"] += 300; impact["mental"] -= 10; impact["discipline"] += 15
        elif decision == "TDG": # Guerra (Defensa agresiva)
            impact["social"] -= 25; impact["health"] -= 15; impact["mental"] += 15; impact["discipline"] += 10

        # 3. Modificadores de Contexto (Impacto de la Vía Real)
        if context in ["enfermedad", "crisis", "conflicto"]:
            # Estos eventos restan agresivamente si no se manejan con TDP o TDB
            if decision not in ["TDP", "TDB"]:
                impact["health"] -= 10; impact["money"] -= 120; impact["mental"] -= 15
        
        elif context == "oportunidad":
            if decision in ["TDP", "TDB"]:
                impact["money"] += 500; impact["discipline"] += 10
            else:
                impact["mental"] -= 10 # Frustración por oportunidad perdida

        # 4. Aplicar Dificultad y Presión Temporal
        # Los impactos negativos se multiplican por la presión; los positivos por la disciplina
        mult = state["difficulty"] * time_pressure
        for key in impact:
            if impact[key] < 0:
                impact[key] *= mult
            elif impact[key] > 0:
                impact[key] *= (1 + (state["discipline"] / 100.0))

        # 5. Actualización de Estado (Atómica)
        state["mental"] = max(0, min(100, state["mental"] + impact["mental"]))
        state["health"] = max(0, min(100, state["health"] + impact["health"]))
        state["money"] = max(0, state["money"] + impact["money"])
        state["social"] = max(0, min(100, state["social"] + impact["social"]))
        state["addiction"] = max(0, min(100, state["addiction"] + impact["addiction"]))
        state["discipline"] = max(0, min(100, state["discipline"] + impact["discipline"]))
        state["age"] += 0.3 # Envejecimiento por decisión

        # 6. Verificación de Colapso (Game Over)
        status = "continue"
        reason = ""
        if state["mental"] <= 0: status = "end"; reason = "quiebra_emocional"
        elif state["health"] <= 0: status = "end"; reason = "muerte_fisica"
        elif state["money"] <= 0 and state["difficulty"] > 1: status = "end"; reason = "insolvencia_extrema"
        
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
    # Configuración para despliegue en Render u otros servicios
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
