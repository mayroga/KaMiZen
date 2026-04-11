from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
import random

app = FastAPI()

# 🔥 CLAVE: SERVIR FRONTEND
app.mount("/static", StaticFiles(directory="static"), name="static")

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

events = [
    "rechazo","amor","dinero","crisis",
    "tentacion","soledad","conflicto","salud"
]

# =========================
# 🎮 START
# =========================
@app.post("/start")
async def start(req: Request):
    data = await req.json()

    age = data.get("age", 18)

    state["age"] = age

    return {
        "profile": {
            "stage": "child" if age < 13 else "young" if age < 30 else "adult"
        },
        "state": state,
        "next_event": random.choice(events)
    }

# =========================
# ⚖️ MOTOR
# =========================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    decision = data.get("decision", "TDM")
    context = data.get("context", "neutral")

    # impactos
    if decision == "TDB":
        state["mental"] += 4
        state["discipline"] += 3

    if decision == "TDM":
        state["mental"] -= 5
        state["addiction"] += 4

    if decision == "TDG":
        state["social"] -= 5

    if decision == "TDK":
        state["mental"] += 5

    # contexto
    if context == "rechazo":
        state["social"] -= 3

    if context == "dinero":
        state["money"] += 100 if decision in ["TDB","TDP"] else -30

    # límites
    state["mental"] = max(0, min(100, state["mental"]))
    state["health"] = max(0, min(100, state["health"]))
    state["social"] = max(0, min(100, state["social"]))

    state["age"] += 0.1

    # final
    if state["mental"] <= 0:
        return {"status":"end","type":"colapso_mental","state":state}

    if state["social"] <= 0:
        return {"status":"end","type":"aislamiento_total","state":state}

    return {
        "status":"continue",
        "state":state,
        "next_event": random.choice(events)
    }
