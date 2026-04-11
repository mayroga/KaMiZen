from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os

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
    "history": []
}

# Rutas de navegación
@app.get("/")
def read_index():
    return FileResponse("static/session.html")

@app.get("/simulador")
def read_sim():
    return FileResponse("static/jet.html")

# ==========================================
# PASO 1 Y 2: GESTIÓN DE INICIO (DESPERTAR)
# ==========================================
@app.post("/start")
async def start_life(req: Request):
    global state
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        # Sincronización con el perfil del usuario
        state["age"] = float(profile.get("age", 18.0))
        state["difficulty"] = int(profile.get("difficulty", 1))
        state["mental"] = 100
        state["health"] = 100
        state["money"] = 1000 if state["difficulty"] == 1 else 500
        state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
        state["social"] = 50
        state["history"] = []

        # Configuración de Música (Atmósfera Lyria 3)
        audio_config = {
            "mood": "dark_industrial" if profile.get("emotion") == "stress" else "ambient_tech",
            "intensity": "high" if state["difficulty"] >= 2 else "normal"
        }

        return {
            "status": "ready",
            "state": state,
            "audio_config": audio_config,
            "next_event": generate_next_event()
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ==========================================
# PASO 6: GENERADOR DE LA VÍA REAL (LA CAZA)
# ==========================================
def generate_next_event():
    # El sistema detecta debilidades para lanzar el siguiente "Tractor" o "Heli"
    if state["addiction"] > 50: return "tentacion"
    if state["money"] < 200: return "crisis"
    if state["health"] < 40: return "enfermedad"
    if state["mental"] < 30: return "conflicto"
    
    # Eventos aleatorios para mantener la dinámica
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis"]
    return random.choice(events)

# ==========================================
# PASO 3, 4 Y 5: PROCESADOR TVID (EL JUEZ)
# ==========================================
@app.post("/judge")
async def judge_decision(req: Request):
    global state
    try:
        data = await req.json()
        decision = data.get("decision", "TDM") # TDM (Inacción/Miedo) por defecto
        context = data.get("context", "neutral")

        # 1. Matriz de Impacto Base por tipo de Decisión
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0}

        if decision == "TDB": # Bien Consciente (Neutralizar con sabiduría)
            impact["mental"] += 10; impact["addiction"] -= 5; impact["social"] += 5
        elif decision == "TDM": # Miedo / Evitación (El golpe entra limpio)
            impact["mental"] -= 12; impact["addiction"] += 10; impact["health"] -= 5
        elif decision == "TDN": # Niño / Emoción (Reacción visceral)
            impact["social"] += 15; impact["money"] -= 100; impact["mental"] += 5
        elif decision == "TDP": # Poder / Acción (Disparo certero)
            impact["money"] += 200; impact["mental"] -= 5; impact["discipline"] += 10
        elif decision == "TDG": # Guerra / Agresión (Destrucción mutua)
            impact["social"] -= 25; impact["health"] -= 15; impact["mental"] += 10

        # 2. Modificadores por Choque de Contexto (Vía Real)
        if context == "enfermedad":
            impact["health"] -= 20; impact["money"] -= 150
        elif context == "crisis":
            impact["money"] -= 200; impact["mental"] -= 20
        elif context == "oportunidad":
            # Si el jugador dispara (TDP) a una oportunidad, la captura
            if decision in ["TDP", "TDB"]:
                impact["money"] += 300; impact["mental"] += 10
        elif context == "conflicto":
            impact["social"] -= 20; impact["health"] -= 10
        elif context == "dinero":
            impact["money"] += 100

        # 3. Factor de Dificultad (Multiplicador de fricción)
        mult = state["difficulty"]
        for key in impact:
            if impact[key] < 0: impact[key] *= mult

        # 4. Actualización Atómica
        state["mental"] = max(0, min(100, state["mental"] + impact.get("mental", 0)))
        state["health"] = max(0, min(100, state["health"] + impact.get("health", 0)))
        state["money"] = max(0, state["money"] + impact.get("money", 0))
        state["social"] = max(0, min(100, state["social"] + impact.get("social", 0)))
        state["addiction"] = max(0, min(100, state["addiction"] + impact.get("addiction", 0)))
        
        # 5. Envejecimiento (Cada interacción es tiempo de vida)
        state["age"] += 0.25 # 3 meses por evento

        # 6. Verificación de Colapso (Game Over)
        status = "continue"
        reason = ""
        if state["mental"] <= 0:
            status = "end"; reason = "quiebra_emocional"
        elif state["health"] <= 0:
            status = "end"; reason = "muerte_fisica"
        elif state["money"] <= 0 and state["difficulty"] > 1:
            status = "end"; reason = "insolvencia_social"
        elif state["age"] >= 90:
            status = "end"; reason = "ciclo_natural_completado"

        return {
            "status": status,
            "type": reason,
            "state": state,
            "next_event": generate_next_event()
        }
    except Exception as e:
        print(f"Error en Judge: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Puerto dinámico para Render/Heroku/Railway
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
