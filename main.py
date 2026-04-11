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
# PASO 1 Y 2: GESTIÓN DE INICIO
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
        state["money"] = 500 if state["difficulty"] > 1 else 1000
        state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
        state["history"] = []

        # Configuración de Música (Meta-datos para Lyria 3)
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
# PASO 6: GENERADOR DE LA VÍA REAL
# ==========================================
def generate_next_event():
    # El sistema analiza vulnerabilidades para atacar
    if state["addiction"] > 45: return "tentacion"
    if state["money"] < 300: return "crisis"
    if state["health"] < 50: return "enfermedad"
    if state["mental"] < 40: return "conflicto"
    
    # Eventos aleatorios si el estado es estable
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis"]
    return random.choice(events)

# ==========================================
# PASO 3, 4 Y 5: PROCESADOR TVID
# ==========================================
@app.post("/judge")
async def judge_decision(req: Request):
    global state
    try:
        data = await req.json()
        decision = data.get("decision", "TDM") # TDM (Evitación) por defecto
        context = data.get("context", "neutral")

        # 1. Matriz de Impacto TVID
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0}

        if decision == "TDB": # Bien Consciente
            impact["mental"] += 8; impact["addiction"] -= 10; impact["social"] += 5
        elif decision == "TDM": # Miedo / Inacción
            impact["mental"] -= 10; impact["addiction"] += 15; impact["health"] -= 2
        elif decision == "TDN": # Emoción Primaria
            impact["social"] += 15; impact["money"] -= 50; impact["mental"] += 5
        elif decision == "TDP": # Poder / Acción
            impact["money"] += 150; impact["mental"] -= 5; impact["health"] -= 3
        elif decision == "TDG": # Agresión
            impact["social"] -= 20; impact["health"] -= 10; impact["mental"] += 5

        # 2. Modificadores de Contexto (Choque con la Realidad)
        if context == "enfermedad":
            impact["health"] -= 20; impact["money"] -= 100
        elif context == "crisis":
            impact["money"] -= 150; impact["mental"] -= 15
        elif context == "tentacion" and decision == "TDM":
            impact["addiction"] += 25; impact["health"] -= 10
        elif context == "amor" and decision == "TDN":
            impact["social"] += 20; impact["mental"] += 10

        # 3. Factor de Dificultad (Multiplicador de daño)
        mult = state["difficulty"]
        for key in impact:
            if impact[key] < 0: impact[key] *= mult

        # 4. Actualización Atómica del Estado
        state["mental"] = max(0, min(100, state["mental"] + impact["mental"]))
        state["health"] = max(0, min(100, state["health"] + impact["health"]))
        state["money"] = max(0, state["money"] + impact["money"])
        state["social"] = max(0, min(100, state["social"] + impact["social"]))
        state["addiction"] = max(0, min(100, state["addiction"] + impact["addiction"]))
        
        # 5. Envejecimiento Progresivo
        state["age"] += 0.25 # Cada decisión avanza 3 meses de vida

        # 6. Verificación de Límites (GameOver)
        status = "continue"
        reason = ""
        if state["mental"] <= 0:
            status = "end"; reason = "quiebra_emocional"
        elif state["health"] <= 0:
            status = "end"; reason = "fallo_organico"
        elif state["money"] <= 0 and state["difficulty"] > 1:
            status = "end"; reason = "exclusion_social"
        elif state["age"] >= 90:
            status = "end"; reason = "fin_del_trayecto"

        return {
            "status": status,
            "type": reason,
            "state": state,
            "next_event": generate_next_event()
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ==========================================
# LANZAMIENTO
# ==========================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    # Importante: host 0.0.0.0 para acceso externo
    uvicorn.run(app, host="0.0.0.0", port=port)
