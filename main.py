import time
import random
from datetime import datetime

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

# =====================
# VARIABLES EN MEMORIA
# =====================

MAX_USERS = 500
SESSION_DURATION = 600  # 10 minutos

session_start_time = time.time()
active_users = set()
chat_messages = []

questions_bank = [
    "¿Qué hiciste hoy que otros no hicieron?",
    "¿Qué excusa debes eliminar ahora mismo?",
    "¿Qué acción te da miedo pero sabes que debes hacer?",
    "¿Dónde estás perdiendo tiempo?",
    "¿Qué decisión cambiaría tu nivel hoy?"
]

feedback_bank = [
    "Bien. Pero puedes más.",
    "Rápido. Mentalidad ganadora.",
    "Otros avanzaron más.",
    "Sigue. No te detengas.",
    "Eso te separa del promedio."
]

# =====================
# LANDING
# =====================

@app.get("/")
async def landing():
    return FileResponse("static/index.html")

@app.get("/session")
async def session():
    return FileResponse("static/session.html")

# =====================
# SESSION INFO
# =====================

@app.get("/session-info")
async def session_info():
    now = time.time()
    elapsed = now - session_start_time

    remaining = SESSION_DURATION - elapsed

    if remaining <= 0:
        remaining = 0

    return {
        "remaining": int(remaining),
        "users": len(active_users),
        "max_users": MAX_USERS
    }

@app.post("/join")
async def join():
    if len(active_users) < MAX_USERS:
        user_id = str(time.time()) + str(random.randint(1,9999))
        active_users.add(user_id)
        return {"user_id": user_id}
    return {"error": "Sesión llena"}

# =====================
# AUDIO
# =====================

@app.get("/audio-file")
async def audio_file():
    day = datetime.utcnow().weekday()

    if day in [0,1,2,3,4]:
        return {"audio": "/audio/monday.mp3"}
    else:
        return {"audio": "/audio/thursday.mp3"}

# =====================
# PREGUNTAS
# =====================

@app.get("/question")
async def get_question():
    return {"question": random.choice(questions_bank)}

class Answer(BaseModel):
    answer: str

@app.post("/answer")
async def submit_answer(data: Answer):
    return {
        "feedback": random.choice(feedback_bank),
        "next_question": random.choice(questions_bank)
    }

# =====================
# CHAT SIMPLE
# =====================

class ChatMessage(BaseModel):
    message: str

@app.post("/chat")
async def send_chat(data: ChatMessage):
    chat_messages.append(data.message)

    if len(chat_messages) > 50:
        chat_messages.pop(0)

    return {"status": "ok"}

@app.get("/chat")
async def get_chat():
    return {"messages": chat_messages[-20:]}
