from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import random

app = FastAPI()

# =========================
# 📁 SERVIR FRONTEND
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return FileResponse("static/session.html")


# =========================
# 🧠 ESTADO GLOBAL
# =========================
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

profile = {
    "stage": "young"
}

# =========================
# 🌍 EVENTOS
# =========================
EVENTS = [
    "rechazo", "amor", "dinero", "crisis",
    "tentacion", "soledad", "conflicto",
    "ansiedad", "enfermedad", "oportunidad"
]

# =========================
# 🎮 GENERADOR INTELIGENTE
# =========================
def generate_event():
    if state["mental"] < 25:
        return "ansiedad"
    if state["health"] < 30:
        return "enfermedad"
    if state["money"] < 200:
        return "crisis"
    if state["social"] < 20:
        return "soledad"
    if state["addiction"] > 60:
        return "tentacion"
    return random.choice(EVENTS)

# =========================
# ⚖️ MOTOR TVID
# =========================
def apply_decision(decision, context):

    global state

    impact = {
        "mental": 0,
        "health": 0,
        "money": 0,
        "social": 0,
        "discipline": 0,
        "addiction": 0
    }

    # TVID
    if decision == "TDB":
        impact["mental"] += 4
        impact["discipline"] += 3
        impact["social"] += 2

    elif decision == "TDM":
        impact["mental"] -= 5
        impact["addiction"] += 4

    elif decision == "TDN":
        impact["mental"] += 2
        impact["social"] += 1

    elif decision == "TDP":
        impact["discipline"] += 5
        impact["social"] += 3

    elif decision == "TDG":
        impact["social"] -= 6
        impact["mental"] -= 3

    elif decision == "TDK":
        impact["mental"] += 5
        impact["social"] += 5

    # CONTEXTO
    if context == "rechazo":
        impact["social"] -= 4 if decision == "TDG" else 2

    if context == "dinero":
        impact["money"] += 100 if decision in ["TDB","TDP"] else -20

    if context == "crisis":
        impact["money"] -= 50 if decision == "TDM" else 10

    if context == "tentacion":
        impact["addiction"] += 10 if decision == "TDM" else -3

    for k in impact:
        state[k] += impact[k]

    # límites
    state["mental"] = max(0, min(100, state["mental"]))
    state["health"] = max(0, min(100, state["health"]))
    state["social"] = max(0, min(100, state["social"]))
    state["discipline"] = max(0, min(100, state["discipline"]))

    state["age"] += 0.1
    state["history"].append({
        "event": context,
        "decision": decision,
        "impact": impact
    })

# =========================
# 💀 FINAL
# =========================
def check_end():
    if state["health"] <= 0:
        return "muerte_fisica"
    if state["mental"] <= 0:
        return "colapso_mental"
    if state["social"] <= 0:
        return "aislamiento_total"
    return None

# =========================
# 🚀 START
# =========================
@app.post("/start")
async def start(req: Request):
    global profile

    data = await req.json()

    age = data.get("age", 18)

    state["age"] = age

    profile = {
        "stage": "child" if age < 13 else "young" if age < 30 else "adult"
    }

    return {
        "profile": profile,
        "state": state,
        "next_event": generate_event()
    }

# =========================
# 🎮 JUEGO
# =========================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    decision = data.get("decision", "TDM")
    context = data.get("context", "neutral")

    apply_decision(decision, context)

    end = check_end()

    if end:
        return {
            "status": "end",
            "type": end,
            "state": state
        }

    return {
        "status": "continue",
        "state": state,
        "next_event": generate_event()
    }
