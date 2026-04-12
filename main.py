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

# Rutas de navegación principales
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
        
        # Reinicio total y blindado de estado para nueva sesión
        difficulty = int(profile.get("difficulty", 1))
        
        state = {
            "age": float(profile.get("age", 18.0)),
            "difficulty": difficulty,
            "mental": 100,
            "health": 100,
            "money": 1500 if difficulty == 1 else 800,
            "addiction": 15 if profile.get("emotion") == "stress" else 0,
            "social": 50,
            "discipline": 50,
            "is_recovery": False,
            "start_time": time.time() 
        }

        return {
            "status": "ready",
            "state": state,
            "next_event": generate_next_event()
        }
    except Exception as e:
        print(f"Error en Inicio Neural: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

# ==========================================
# GENERADOR DE LA VÍA REAL
# ==========================================
def generate_next_event():
    # El motor prioriza crisis según el estado actual
    if state["addiction"] > 65: return "tentacion"
    if state["money"] < 300: return "crisis"
    if state["health"] < 45: return "enfermedad"
    if state["mental"] < 35: return "conflicto"
    
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
        
        # 1. CONTROL DE TIEMPO (7 min acción + 8 min calma = 15 min total)
        elapsed_seconds = time.time() - state["start_time"]
        
        # Transición automática a fase de recuperación
        if elapsed_seconds > 420: # 7 minutos
            state["is_recovery"] = True
            return {
                "status": "recovery", 
                "state": state,
                "message": "Fase de Acción agotada. Iniciando Calma Neural."
            }

        # Dificultad Progresiva: El multiplicador sube conforme avanza el tiempo
        time_pressure = 1.0 + (min(elapsed_seconds, 420) / 420.0) * 2.0

        # 2. Matriz de Impacto Base (Valores TVID)
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0, "discipline": 0}

        if decision == "TDB": # Bien Consciente
            impact["mental"] += 15; impact["addiction"] -= 12; impact["social"] += 10; impact["discipline"] += 5
        elif decision == "TDM": # Miedo (Inacción) - Es el más castigado
            impact["mental"] -= 25; impact["addiction"] += 20; impact["health"] -= 12; impact["discipline"] -= 15
        elif decision == "TDN": # Niño (Emoción/Impulso)
            impact["social"] += 20; impact["money"] -= 200; impact["discipline"] -= 8
        elif decision == "TDP": # Poder (Acción Directa)
            impact["money"] += 450; impact["mental"] -= 15; impact["discipline"] += 20
        elif decision == "TDG": # Guerra (Defensa Agresiva)
            impact["social"] -= 30; impact["health"] -= 20; impact["mental"] += 20; impact["discipline"] += 12
        elif decision == "ataque_enemigo": # Colisión de proyectiles
            impact["health"] -= 15; impact["mental"] -= 10

        # 3. Modificadores por Contexto (Sincronía con Vía Real)
        if context in ["enfermedad", "crisis", "conflicto"]:
            if decision not in ["TDP", "TDB"]: # Si no se usa Poder o Bien, el contexto daña
                impact["health"] -= 15; impact["money"] -= 150; impact["mental"] -= 15
        
        elif context == "oportunidad":
            if decision in ["TDP", "TDB"]:
                impact["money"] += 600; impact["discipline"] += 15
            else:
                impact["mental"] -= 15 # Frustración por inacción

        # 4. Aplicar Multiplicadores (Presión del Entorno vs Disciplina)
        mult = state["difficulty"] * time_pressure
        for key in impact:
            if impact[key] < 0:
                # La disciplina mitiga el daño (hasta un 50%)
                mitigation = 1.0 - (state["discipline"] / 200.0)
                impact[key] *= (mult * mitigation)
            elif impact[key] > 0:
                # La disciplina potencia las ganancias
                impact[key] *= (1 + (state["discipline"] / 100.0))

        # 5. Actualización de Estado (Atómica y Limitada)
        state["mental"] = max(0, min(100, state["mental"] + impact["mental"]))
        state["health"] = max(0, min(100, state["health"] + impact["health"]))
        state["money"] = max(0, state["money"] + impact["money"])
        state["social"] = max(0, min(100, state["social"] + impact["social"]))
        state["addiction"] = max(0, min(100, state["addiction"] + impact["addiction"]))
        state["discipline"] = max(0, min(100, state["discipline"] + impact["discipline"]))
        state["age"] += 0.4 # Envejecimiento progresivo

        # 6. Verificación de Colapso (Game Over)
        status = "continue"
        reason = ""
        if state["mental"] <= 0: status = "end"; reason = "quiebra_emocional"
        elif state["health"] <= 0: status = "end"; reason = "muerte_fisica"
        elif state["money"] <= 0 and state["difficulty"] > 1: status = "end"; reason = "insolvencia_total"
        
        return {
            "status": status,
            "type": reason,
            "state": state,
            "next_event": generate_next_event(),
            "pressure": round(time_pressure, 2),
            "elapsed": int(elapsed_seconds)
        }
    except Exception as e:
        print(f"Error Crítico en Juez: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Puerto dinámico para Render o local
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
