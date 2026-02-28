from fastapi import FastAPI, Request, Form, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import random
import datetime
import os

# -------------------------
# CONFIGURACIÓN ADMIN / PAGOS
# -------------------------
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# -------------------------
# APP
# -------------------------
app = FastAPI(title="KaMiZen Production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar carpeta correcta
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------
# VARIABLES GLOBALES
# -------------------------
active_tokens = {}           # token -> True/False
active_users = set()         # usuarios conectados en sesión
placeholder_messages = [
    "Usuario 42 ha subido nivel",
    "Alguien respondió una pregunta",
    "Usuario 87 avanzó rápido",
]
chat_messages: List[Dict] = []  # chat efímero en tiempo real
banned_words = ["demand", "lawsuit", "illegal", "drugs"]
session_start_times = {}  # token -> datetime de inicio

# Banco de preguntas
question_bank = [
    "¿Qué hiciste ayer que te acerca a tu meta?",
    "¿Qué estás evitando ahora mismo?",
    "Si repites esta semana 52 veces, ¿estarías orgulloso de tu año?",
    "¿Quién gana si tú fallas?",
    "Si no actúas hoy, ¿quién sube nivel antes que tú?",
]

# -------------------------
# FUNCIONES AUXILIARES
# -------------------------
def generate_token() -> str:
    import uuid
    token = str(uuid.uuid4())
    active_tokens[token] = True
    return token

def verify_token(token: str) -> bool:
    return token in active_tokens

def get_audio_file():
    # Audio diario: monday.mp3
    return "/static/audio/monday.mp3"

def random_question_for_user():
    return random.choice(question_bank)

def sanitize_message(msg: str) -> str:
    for word in banned_words:
        if word.lower() in msg.lower():
            return "[mensaje bloqueado]"
    return msg

# -------------------------
# ROUTES
# -------------------------
@app.get("/")
def landing():
    return FileResponse("static/index.html")

# -------------------------
# LOGIN ADMIN
# -------------------------
@app.post("/admin-login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401)
    token = generate_token()
    return {"token": token, "admin": True}

# -------------------------
# COMPRA ENTRADA
# -------------------------
@app.post("/purchase")
def purchase():
    # Simulación de compra
    token = generate_token()
    return {"access_token": token}

# -------------------------
# SESIÓN 10 MINUTOS DIARIA
# -------------------------
@app.get("/session")
def session_page(token: str = Query(...)):
    if not verify_token(token):
        raise HTTPException(status_code=403)

    now = datetime.datetime.now()
    # Inicia sesión si no existe
    if token not in session_start_times:
        session_start_times[token] = now
    # Revisa duración 10 minutos
    elif (now - session_start_times[token]).total_seconds() > 10*60:
        raise HTTPException(status_code=403, detail="Sesión terminada")

    active_users.add(token)
    return FileResponse("static/session.html")

# -------------------------
# PREGUNTAS ALEATORIAS
# -------------------------
class AnswerRequest(BaseModel):
    token: str
    answer: str

@app.post("/submit-answer")
def submit_answer(req: AnswerRequest):
    if not verify_token(req.token):
        raise HTTPException(status_code=403)
    # Feedback único para usuario
    return {"status": "ok", "feedback": f"Perfecto, hoy avanzaste más que ayer: {random_question_for_user()}"}

# -------------------------
# CHAT EFÍMERO
# -------------------------
class ChatMessage(BaseModel):
    token: str
    message: str

@app.post("/chat")
def chat(msg: ChatMessage):
    if not verify_token(msg.token):
        raise HTTPException(status_code=403)
    sanitized = sanitize_message(msg.message)
    chat_messages.append({"token": msg.token, "message": sanitized, "time": datetime.datetime.now()})
    if len(chat_messages) > 50:
        chat_messages.pop(0)
    return {"status": "ok"}

@app.get("/chat")
def get_chat(token: str = Query(...)):
    if not verify_token(token):
        raise HTTPException(status_code=403)
    now = datetime.datetime.now()
    recent = [
        m["message"] for m in chat_messages
        if (now - m["time"]).total_seconds() <= 30
    ]
    while len(recent) < 10:
        recent.append(random.choice(placeholder_messages))
    random.shuffle(recent)
    return {"messages": recent}

# -------------------------
# CONTADOR DE USUARIOS
# -------------------------
@app.get("/active-users")
def get_active_users(token: str = Query(...)):
    if not verify_token(token):
        raise HTTPException(status_code=403)
    return {"count": len(active_users), "max": 500}

# -------------------------
# AUDIO DINÁMICO
# -------------------------
@app.get("/audio")
def get_audio(token: str = Query(...)):
    if not verify_token(token):
        raise HTTPException(status_code=403)
    return {"audio_file": get_audio_file()}

# -------------------------
# CIERRE DE SESIÓN
# -------------------------
@app.post("/logout")
def logout(token: str = Form(...)):
    if token in active_tokens:
        active_tokens.pop(token)
    if token in active_users:
        active_users.remove(token)
    if token in session_start_times:
        session_start_times.pop(token)
    return {"status": "ok", "message": "Sesión terminada. Los que no subieron nivel hoy, comienzan mañana en desventaja. Asegura tu lugar."}
