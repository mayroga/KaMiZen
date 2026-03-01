from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import random
import os

app = FastAPI(title="KaMiZen NeuroFinancial Game")

# -----------------------------
# CORS (si frontend se separa)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# STATIC FILES (frontend, audio)
# -----------------------------
if not os.path.exists("frontend"):
    os.makedirs("frontend")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

# -----------------------------
# DATA SIMULADA / RETOS
# -----------------------------
QUESTIONS = [
    {"q": "Si hoy me siento 3 puntos feliz y mañana 5 más… ¿cuánto tendré?", "a": "8"},
    {"q": "¿Cuánto es el doble de 12?", "a": "24"},
    {"q": "3, 6, 9, ___", "a": "12"},
    {"q": "Número par >10 y <20. Si me divides entre 2 da 7. ¿Quién soy?", "a": "14"},
    {"q": "Si tengo 50 y pierdo 7, ¿cuánto queda?", "a": "43"},
    {"q": "Cruzo fronteras sin pasaporte y guardo tesoros. ¿Qué soy?", "a": "conocimiento de embarque"}
]

RANKING_BOTS = ["TraderA", "TraderB", "TraderC", "TraderD"]

MINI_STORIES = [
    "💡 Ana duplicó su productividad con esta decisión.",
    "🔥 Carlos avanzó 2 niveles resolviendo rápido.",
    "🏆 Pedro aplicó la estrategia y subió de nivel.",
    "⚡ Luisa resolvió el reto y siente dopamina."
]

AUDIO_FILES = [
    "male1.mp3",
    "male2.mp3"
]

# -----------------------------
# ENDPOINTS
# -----------------------------

@app.get("/")
async def root():
    # Servir el HTML principal
    return FileResponse("frontend/session.html")

@app.get("/challenge")
async def get_challenge():
    game = random.choice(QUESTIONS)
    return JSONResponse(content=game)

@app.get("/ranking")
async def get_ranking(user_level: int = 1):
    ranking = []
    for bot in RANKING_BOTS:
        level = user_level + random.randint(0, 2)
        ranking.append({"name": bot, "level": level})
    ranking.append({"name": "Tú", "level": user_level})
    return JSONResponse(content=ranking)

@app.get("/mini-story")
async def get_mini_story():
    story = random.choice(MINI_STORIES)
    return JSONResponse(content={"story": story})

@app.get("/audio")
async def get_audio():
    clip = random.choice(AUDIO_FILES)
    path = os.path.join("frontend", "audio", clip)
    if os.path.exists(path):
        return FileResponse(path)
    return JSONResponse(content={"error": "Archivo no encontrado"}, status_code=404)

# -----------------------------
# RUN
# -----------------------------
# Este archivo se ejecuta con:
# uvicorn main:app --host 0.0.0.0 --port 8000
# -----------------------------
