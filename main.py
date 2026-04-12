from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os

app = FastAPI()

# Asegurar existencia de carpeta static y montar para servir archivos front-end
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# ESTADO GLOBAL DEL MOTOR (ESTRUCTURA TVID)
# ==========================================
# Nota: En producción con múltiples usuarios, esto debería ir en una DB o sesión.
state = {
    "mental": 100,
    "health": 100,
    "money": 1000,
    "social": 50,
    "discipline": 50,
    "addiction": 0,
    "age": 25.0,
    "difficulty": 1,
    "history": []
}

# ==========================================
# RUTAS DE NAVEGACIÓN
# ==========================================
@app.get("/")
def read_index():
    # Pantalla de configuración inicial
    return FileResponse("static/jet.html")

@app.get("/simulador")
def read_sim():
    # Pantalla del flujo de vida real (requiere session.html o el template del simulador)
    return FileResponse("static/session.html")

# ==========================================
# GESTIÓN DE INICIO (DESPERTAR)
# ==========================================
@app.post("/start")
async def start_life(req: Request):
    global state
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        # Sincronización con el perfil configurado en jet.html
        state["age"] = float(profile.get("age", 25.0))
        state["difficulty"] = int(profile.get("difficulty", 1))
        state["mental"] = 100
        state["health"] = 100
        
        # Lógica de dinero inicial según entorno
        if state["difficulty"] == 3:
            state["money"] = 200
        elif state["difficulty"] == 2:
            state["money"] = 500
        else:
            state["money"] = 1000

        state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
        state["social"] = 50
        state["discipline"] = 50
        state["history"] = []

        # Configuración de Atmósfera Sonora
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
# GENERADOR DE LA VÍA REAL (LA CAZA)
# ==========================================
def generate_next_event():
    # Prioridad por estado crítico (El sistema detecta debilidades)
    if state["addiction"] > 60: return "tentacion"
    if state["money"] < 100: return "crisis"
    if state["health"] < 30: return "enfermedad"
    if state["mental"] < 25: return "conflicto"
    
    # Eventos aleatorios de la Vía Real
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad", "crisis"]
    return random.choice(events)

# ==========================================
# PROCESADOR TVID (EL JUEZ)
# ==========================================
@app.post("/judge")
async def judge_decision(req: Request):
    global state
    try:
        data = await req.json()
        decision = data.get("decision", "TDM") # TDM (Inacción) por defecto tras timeout
        context = data.get("context", "neutral")

        # 1. Matriz de Impacto Base por tipo de Decisión
        impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0, "discipline": 0}

        if decision == "TDB": # Bien Consciente (Sabiduría)
            impact["mental"] += 8; impact["addiction"] -= 10; impact["social"] += 5; impact["discipline"] += 5
        elif decision == "TDM": # Miedo / Inacción (El golpe entra limpio)
            impact["mental"] -= 15; impact["addiction"] += 12; impact["health"] -= 8; impact["discipline"] -= 5
        elif decision == "TDN": # Niño / Emoción (Visceral)
            impact["social"] += 20; impact["money"] -= 150; impact["mental"] += 10; impact["discipline"] -= 10
        elif decision == "TDP": # Poder / Acción (Estrategia)
            impact["money"] += 250; impact["mental"] -= 10; impact["discipline"] += 15; impact["social"] -= 5
        elif decision == "TDG": # Guerra / Agresión (Destrucción)
            impact["social"] -= 30; impact["health"] -= 20; impact["mental"] += 15; impact["money"] -= 100

        # 2. Modificadores por Contexto (Choque con la Realidad)
        if context == "enfermedad":
            impact["health"] -= 25; impact["money"] -= 200
        elif context == "crisis":
            impact["money"] -= 300; impact["mental"] -= 25
        elif context == "oportunidad":
            if decision in ["TDP", "TDB"]:
                impact["money"] += 400; impact["mental"] += 15; impact["discipline"] += 10
            else: # Perder la oportunidad por miedo o juego
                impact["mental"] -= 10
        elif context == "conflicto":
            if decision == "TDG":
                impact["health"] -= 30; impact["social"] -= 40
            elif decision == "TDB":
                impact["social"] += 10; impact["mental"] -= 5
        elif context == "amor":
            if decision == "TDN": impact["mental"] += 20; impact["social"] += 15
            if decision == "TDP": impact["money"] -= 200; impact["social"] += 10

        # 3. Factor de Dificultad (Multiplicador de daño)
        mult = state["difficulty"]
        for key in impact:
            if impact[key] < 0:
                impact[key] *= mult

        # 4. Actualización Atómica de Variables
        state["mental"] = max(0, min(100, state["mental"] + impact.get("mental", 0)))
        state["health"] = max(0, min(100, state["health"] + impact.get("health", 0)))
        state["money"] = max(0, state["money"] + impact.get("money", 0))
        state["social"] = max(0, min(100, state["social"] + impact.get("social", 0)))
        state["discipline"] = max(0, min(100, state["discipline"] + impact.get("discipline", 0)))
        state["addiction"] = max(0, min(100, state["addiction"] + impact.get("addiction", 0)))
        
        # 5. Envejecimiento (3 meses por cada decisión tomada)
        state["age"] += 0.25

        # 6. Verificación de Ciclo de Recuperación (TVID)
        # Si la disciplina es baja o la adicción alta, entra en recuperación
        status = "continue"
        if state["addiction"] > 80 or state["mental"] < 20:
            status = "recovery"

        # 7. Verificación de Colapso (Game Over)
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
        return JSONResponse(status_code=500, content={"error": "Fallo en el procesamiento neural."})

# ==========================================
# EJECUCIÓN DEL SERVIDOR
# ==========================================
if __name__ == "__main__":
    import uvicorn
    # Configuración de puerto para despliegue en la nube
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
