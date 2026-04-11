from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# ESTADO INICIAL (PASO 1)
state = {
    "mental": 100,
    "health": 100,
    "money": 1000,
    "social": 50,
    "discipline": 50,
    "addiction": 0,
    "age": 18,
    "history": []
}

@app.get("/")
def home():
    return FileResponse("static/session.html")

# GENERADOR INTELIGENTE (PASO 6)
def generate_event():
    # El sistema te persigue según tus debilidades
    if state["addiction"] > 60: return "tentacion"
    if state["money"] < 200: return "crisis"
    if state["mental"] < 30: return "ansiedad"
    if state["social"] < 20: return "soledad"
    
    return random.choice(["rechazo", "amor", "dinero", "conflicto", "oportunidad", "enfermedad"])

# MOTOR DE PROCESAMIENTO TVID (PASO 3 y 4)
def apply_impact(decision, context):
    global state
    impact = {k: 0 for k in ["mental", "health", "money", "social", "discipline", "addiction"]}

    # Lógica de Decisiones TVID
    if decision == "TDB": # Bien consciente
        impact["mental"] += 5; impact["discipline"] += 5
    elif decision == "TDM": # Evitación/Vicio
        impact["mental"] -= 5; impact["addiction"] += 8
    elif decision == "TDG": # Guerra/Agresión
        impact["social"] -= 10; impact["mental"] -= 5
    elif decision == "TDP": # Guía/Responsabilidad
        impact["discipline"] += 10; impact["money"] += 5
    elif decision == "TDN": # Niño/Emoción
        impact["social"] += 5; impact["discipline"] -= 2

    # Lógica de Contexto (PASO 4)
    if context == "crisis" and decision == "TDM":
        impact["money"] -= 100
    if context == "enfermedad":
        impact["health"] -= 10
    if context == "oportunidad" and decision == "TDP":
        impact["money"] += 200

    # Aplicar y Limitar
    for k, v in impact.items():
        state[k] = max(0, min(100, state[k] + v))
    
    # Envejecimiento (PASO 7)
    state["age"] += 0.2
    state["history"].append({"event": context, "decision": decision})

@app.post("/start")
async def start(req: Request):
    global state
    data = await req.json()
    state["age"] = data.get("age", 18)
    return {"status": "ready", "state": state, "next_event": generate_event()}

@app.post("/judge")
async def judge(req: Request):
    data = await req.json()
    decision = data.get("decision", "TDM") # Si no decide, la vida elige TDM
    context = data.get("context", "neutral")
    
    apply_impact(decision, context)
    
    # Comprobar Finales (PASO 8)
    end_type = None
    if state["health"] <= 0: end_type = "muerte_fisica"
    if state["mental"] <= 0: end_type = "colapso_mental"
    if state["money"] <= 0: end_type = "quiebra_total"

    return {
        "status": "end" if end_type else "continue",
        "type": end_type,
        "state": state,
        "next_event": generate_event()
    }
