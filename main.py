from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import random

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# 👤 PERFIL
# =========================
player_profile = {
    "age": 25,
    "stage": "adulto"
}

# =========================
# 🧠 ESTADO
# =========================
player_state = {
    "mental": 100,
    "money": 1000,
    "social": 50,
    "health": 100,
    "addiction": 0,
    "experience": 0,
    "history": []
}

# =========================
# 🎯 START REAL
# =========================
@app.post("/start")
async def start(request: Request):

    data = await request.json()
    age = int(data.get("age", 25))

    if age <= 12:
        stage = "nino"
    elif age <= 25:
        stage = "joven"
    elif age <= 60:
        stage = "adulto"
    else:
        stage = "anciano"

    global player_profile, player_state

    player_profile = {"age": age, "stage": stage}

    player_state = {
        "mental": 100,
        "money": 500 if stage == "joven" else 1000,
        "social": 60,
        "health": 100,
        "addiction": 0,
        "experience": 0,
        "history": []
    }

    return {"profile": player_profile, "state": player_state}

# =========================
# 🌍 EVENTOS
# =========================
EVENT_POOL = ["rechazo","conflicto","perdida","oportunidad","tentacion"]

def generate_event(state):

    if state["addiction"] > 60:
        return "tentacion"

    if state["money"] < 100:
        return "perdida"

    if state["social"] < 20:
        return "rechazo"

    return random.choice(EVENT_POOL)

# =========================
# 🧠 IA EMOCIONAL REAL
# =========================
def emotional_engine(decision, context, state, profile):

    stage = profile["stage"]

    sensitivity = {
        "nino": 1.5,
        "joven": 1.2,
        "adulto": 1.0,
        "anciano": 1.3
    }[stage]

    if context == "rechazo":
        if decision == "TDB":
            state["mental"] += int(5 * sensitivity)
        elif decision == "TDM":
            state["mental"] -= int(4 * sensitivity)
            state["addiction"] += 2
        elif decision == "TDG":
            state["social"] -= int(8 * sensitivity)

    if context == "perdida":
        state["money"] -= random.randint(20, 80)

    if context == "tentacion":
        if decision == "TDM":
            state["addiction"] += int(10 * sensitivity)

    state["mental"] = max(0, min(100, state["mental"]))
    state["social"] = max(0, min(100, state["social"]))
    state["health"] = max(0, min(100, state["health"]))

    state["experience"] += 1

    return state

# =========================
# 🏠 HOME
# =========================
@app.get("/", response_class=HTMLResponse)
def home():
    return open(os.path.join(BASE_DIR, "static/session.html"), encoding="utf-8").read()

# =========================
# 🧠 JUDGE
# =========================
@app.post("/judge")
async def judge(request: Request):

    data = await request.json()

    decision = data.get("decision")
    context = data.get("context")

    global player_state

    player_state = emotional_engine(
        decision,
        context,
        player_state,
        player_profile
    )

    next_event = generate_event(player_state)

    return {
        "state": player_state,
        "next_event": next_event,
        "profile": player_profile
    }
