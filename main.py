from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import random

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# 🧠 ESTADO GLOBAL (VIDA)
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
# 🌍 EVENTOS BASE
# =========================
EVENT_POOL = [
    "rechazo",
    "conflicto",
    "oportunidad",
    "perdida",
    "critica",
    "soledad",
    "enfermedad",
    "tentacion"
]

# =========================
# 🧠 GENERADOR DE EVENTOS
# =========================
def generate_event(state):

    if state["health"] <= 20:
        return "enfermedad"

    if state["addiction"] > 60:
        return "problema_adiccion"

    if state["money"] < 100:
        return "crisis_economica"

    if state["social"] < 20:
        return "soledad_profunda"

    return random.choice(EVENT_POOL)

# =========================
# ⚖️ MOTOR DE DECISIONES (TVID)
# =========================
def apply_decision(decision, context, state):

    # COPIA PARA MODIFICAR
    new_state = state.copy()

    # =====================
    # 🔴 CONTEXTO: RECHAZO
    # =====================
    if context == "rechazo":

        if decision == "TDB":
            new_state["mental"] += 5
            new_state["social"] += 2

        elif decision == "TDM":
            new_state["mental"] -= 3
            new_state["addiction"] += 2

        elif decision == "TDN":
            new_state["mental"] += 4

        elif decision == "TDG":
            new_state["mental"] -= 6
            new_state["social"] -= 8

    # =====================
    # 💸 CONTEXTO: PERDIDA
    # =====================
    elif context == "perdida":

        if decision == "TDB":
            new_state["mental"] += 3

        elif decision == "TDM":
            new_state["mental"] -= 5
            new_state["addiction"] += 3

        elif decision == "TDN":
            new_state["mental"] += 2

        elif decision == "TDG":
            new_state["mental"] -= 4

        new_state["money"] -= random.randint(20, 100)

    # =====================
    # 😡 CONFLICTO
    # =====================
    elif context == "conflicto":

        if decision == "TDB":
            new_state["social"] += 3

        elif decision == "TDM":
            new_state["social"] -= 3

        elif decision == "TDG":
            new_state["social"] -= 10
            new_state["mental"] -= 5

    # =====================
    # 🍷 TENTACIÓN / VICIOS
    # =====================
    elif context == "tentacion":

        if decision == "TDB":
            new_state["addiction"] -= 5

        elif decision == "TDM":
            new_state["addiction"] += 10
            new_state["health"] -= 3

        elif decision == "TDN":
            new_state["addiction"] -= 2

    # =====================
    # 🏥 ENFERMEDAD
    # =====================
    elif context == "enfermedad":

        if decision == "TDB":
            new_state["health"] += 5

        elif decision == "TDM":
            new_state["health"] -= 5

        elif decision == "TDN":
            new_state["mental"] += 2

    # =====================
    # 📈 OPORTUNIDAD
    # =====================
    elif context == "oportunidad":

        if decision == "TDB":
            new_state["money"] += random.randint(50, 150)

        elif decision == "TDG":
            new_state["money"] += random.randint(100, 300)
            new_state["social"] -= 5

    # =====================
    # 🧠 NORMALIZAR VALORES
    # =====================
    for key in ["mental", "health", "social"]:
        new_state[key] = max(0, min(100, new_state[key]))

    # EXPERIENCIA
    new_state["experience"] += 1

    # HISTORIAL
    new_state["history"].append({
        "event": context,
        "decision": decision
    })

    return new_state

# =========================
# 💀 CHECK FINAL
# =========================
def check_end(state):

    if state["health"] <= 0:
        return "muerte_fisica"

    if state["mental"] <= 0:
        return "colapso_mental"

    return None

# =========================
# 🏠 HOME
# =========================
@app.get("/", response_class=HTMLResponse)
def home():
    return open(os.path.join(BASE_DIR, "static/session.html"), encoding="utf-8").read()

# =========================
# 🧠 JUDGE REAL
# =========================
@app.post("/judge")
async def judge(request: Request):

    try:
        data = await request.json()
    except:
        data = {}

    decision = data.get("decision", "")
    context = data.get("context", "neutral")

    global player_state

    # 🔥 APLICAR DECISIÓN REAL
    player_state = apply_decision(decision, context, player_state)

    # 💀 VERIFICAR FINAL
    end = check_end(player_state)

    if end:
        return JSONResponse({
            "status": "end",
            "type": end,
            "state": player_state
        })

    # 🔄 GENERAR SIGUIENTE EVENTO
    next_event = generate_event(player_state)

    return JSONResponse({
        "status": "continue",
        "state": player_state,
        "next_event": next_event
    })
