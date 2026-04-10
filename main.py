from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import random

# =========================
# APP INIT (ESTO ES LO PRIMERO)
# =========================
app = FastAPI()

# =========================
# STATIC FILES
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")


# =========================
# FRONTEND ROUTES
# =========================
@app.get("/", response_class=HTMLResponse)
def home():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return f.read()


@app.get("/jet", response_class=HTMLResponse)
def jet():
    with open("static/jet.html", "r", encoding="utf-8") as f:
        return f.read()


@app.get("/life", response_class=HTMLResponse)
def life():
    with open("static/life.html", "r", encoding="utf-8") as f:
        return f.read()


# =========================
# IA JUDGE ENGINE (PYTHON)
# =========================
@app.post("/judge")
async def judge(request: Request):
    data = await request.json()

    decision = data.get("decision", "none")
    context = data.get("context", {})

    # =========================
    # LÓGICA DE "JUEZ IA"
    # =========================

    base_score = random.randint(-5, 5)

    # reglas simples de juicio
    if decision == "avoid":
        score = base_score + 3
        msg = "CONTROL EMOCIONAL +1"
    elif decision == "engage":
        score = base_score - 2
        msg = "CONFLICTO DETECTADO"
    elif decision == "adapt":
        score = base_score + 5
        msg = "INTELIGENCIA SOCIAL ACTIVA"
    else:
        score = base_score
        msg = "DECISION NEUTRAL"

    # impacto emocional simulado
    stress = random.randint(-3, 6)

    return JSONResponse({
        "score": score,
        "stress": stress,
        "message": msg,
        "state": "processed"
    })
