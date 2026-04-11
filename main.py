from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os

app = FastAPI()

# Montar archivos estáticos para CSS, JS e imágenes
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# ESTADO DEL MOTOR IA (ESTRUCTURA TVID)
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

@app.get("/")
def read_index():
    return FileResponse("static/session.html")

# ==========================================
# PASO 1 Y 2: INICIO DE VIDA
# ==========================================
@app.post("/start")
async def start_life(req: Request):
    global state
    data = await req.json()
    profile = data.get("profile", {})
    
    # Reiniciar estado basado en el perfil de entrada
    state["age"] = float(profile.get("age", 25))
    state["difficulty"] = int(profile.get("difficulty", 1))
    state["mental"] = 100
    state["health"] = 100
    state["money"] = 500 if state["difficulty"] > 1 else 1000
    state["addiction"] = 15 if profile.get("emotion") == "stress" else 0
    state["history"] = []

    # Configuración de Música (Lyria 3 Logic)
    audio_config = {
        "mood": "dark_industrial" if profile.get("emotion") == "stress" else "ambient_tech",
        "intensity": "high" if state["difficulty"] == 3 else "normal"
    }

    return {
        "status": "ready",
        "state": state,
        "audio_config": audio_config,
        "next_event": generate_next_event()
    }

# ==========================================
# PASO 6: EL SISTEMA TE PERSIGUE
# ==========================================
def generate_next_event():
    # El sistema analiza tus debilidades para el próximo choque
    if state["addiction"] > 50: return "tentacion"
    if state["money"] < 200: return "crisis"
    if state["health"] < 40: return "enfermedad"
    if state["mental"] < 30: return "conflicto"
    
    events = ["dinero", "amor", "oportunidad", "conflicto", "enfermedad"]
    return random.choice(events)

# ==========================================
# PASO 3, 4 Y 5: PROCESADOR TVID
# ==========================================
@app.post("/judge")
async def judge_decision(req: Request):
    global state
    data = await req.json()
    decision = data.get("decision", "TDM")  # TDM por defecto si no hay acción
    context = data.get("context", "neutral")

    # 1. Impacto Base de Decisiones TVID
    impact = {"mental": 0, "health": 0, "money": 0, "social": 0, "addiction": 0}

    if decision == "TDB": # Bien Consciente
        impact["mental"] += 5; impact["addiction"] -= 5
    elif decision == "TDM": # Miedo / Evitación
        impact["mental"] -= 5; impact["addiction"] += 10
    elif decision == "TDN": # Niño / Emoción
        impact["social"] += 10; impact["mental"] += 5
    elif decision == "TDP": # Poder / Responsabilidad
        impact["money"] += 50; impact["mental"] -= 2
    elif decision == "TDG": # Guerra / Agresión
        impact["social"] -= 15; impact["health"] -= 5

    # 2. Impacto de Contexto (Vía Real)
    if context == "enfermedad":
        impact["health"] -= 15; impact["money"] -= 50
    elif context == "crisis":
        impact["money"] -= 100; impact["mental"] -= 10
    elif context == "oportunidad" and decision == "TDP":
        impact["money"] += 200; impact["mental"] += 5
    elif context == "tentacion" and decision == "TDM":
        impact["addiction"] += 20; impact["health"] -= 5

    # 3. Aplicar Multiplicador de Dificultad
    multiplier = state["difficulty"]
    for key in impact:
        if impact[key] < 0: impact[key] *= multiplier

    # 4. Actualizar Estado Global
    state["mental"] = max(0, min(100, state["mental"] + impact["mental"]))
    state["health"] = max(0, min(100, state["health"] + impact["health"]))
    state["money"] = max(0, state["money"] + impact["money"])
    state["social"] = max(0, min(100, state["social"] + impact["social"]))
    state["addiction"] = max(0, min(100, state["addiction"] + impact["addiction"]))
    
    # 5. Envejecimiento (Paso 7)
    state["age"] += 0.2

    # 6. Verificar Colapsos (Paso 8)
    status = "continue"
    end_reason = ""
    if state["mental"] <= 0:
        status = "end"; end_reason = "colapso_mental"
    elif state["health"] <= 0:
        status = "end"; end_reason = "muerte_fisica"
    elif state["money"] <= 0 and state["difficulty"] > 1:
        status = "end"; end_reason = "quiebra_total"

    return {
        "status": status,
        "type": end_reason,
        "state": state,
        "next_event": generate_next_event()
    }

if __name__ == "__main__":
    import uvicorn
    # Puerto dinámico para despliegue en la nube
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
