import os
import time
import random
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import jwt
import stripe

# =========================
# CONFIG
# =========================

SECRET_KEY = "kamizen_secret_key"
ALGORITHM = "HS256"

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

MAX_USERS = 500
SESSION_DURATION = 600  # 10 minutos

active_users = {}
chat_messages = []

# =========================
# APP
# =========================

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

# =========================
# HELPERS
# =========================

def create_token(username: str):
    expire = datetime.utcnow() + timedelta(minutes=10)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

# =========================
# LANDING
# =========================

@app.get("/", response_class=HTMLResponse)
async def landing():
    return FileResponse("static/index.html")

# =========================
# ADMIN LOGIN
# =========================

class AdminLogin(BaseModel):
    username: str
    password: str

@app.post("/admin-login")
async def admin_login(data: AdminLogin):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        token = create_token("admin")
        return {"token": token}
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")

# =========================
# STRIPE CHECKOUT
# =========================

@app.post("/create-checkout-session")
async def create_checkout_session():
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "KaMiZen Session"},
                "unit_amount": 999,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url="https://kamizen.onrender.com/success",
        cancel_url="https://kamizen.onrender.com/",
    )
    return {"id": session.id}

@app.get("/success")
async def payment_success():
    token = create_token("paid_user")
    return JSONResponse({"token": token})

# =========================
# VALIDATE TOKEN
# =========================

@app.get("/validate-token")
async def validate_token(token: str):
    data = verify_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Token inválido")

    username = data["sub"]

    if username not in active_users:
        if len(active_users) >= MAX_USERS:
            raise HTTPException(status_code=403, detail="Sesión llena")
        active_users[username] = time.time()

    return {"status": "ok"}

# =========================
# PARTICIPANTES
# =========================

@app.get("/active-users")
async def active(token: str):
    if not verify_token(token):
        raise HTTPException(status_code=401)

    return {"count": len(active_users), "max": MAX_USERS}

# =========================
# AUDIO DINÁMICO
# =========================

@app.get("/audio-file")
async def audio_file(token: str):
    if not verify_token(token):
        raise HTTPException(status_code=401)

    day = datetime.utcnow().weekday()

    if day in [0, 1, 2, 3, 4]:
        return {"audio": "/audio/monday.mp3"}
    else:
        return {"audio": "/audio/thursday.mp3"}

# =========================
# PREGUNTAS
# =========================

questions_bank = [
    "¿Qué hiciste hoy que otros no hicieron?",
    "¿Qué excusa debes eliminar ahora mismo?",
    "¿Qué acción te da miedo pero sabes que debes hacer?",
    "¿Dónde estás perdiendo tiempo?"
]

class Answer(BaseModel):
    token: str
    answer: str

@app.post("/submit-answer")
async def submit_answer(data: Answer):
    if not verify_token(data.token):
        raise HTTPException(status_code=401)

    feedback = random.choice([
        "Bien. Pero puedes más.",
        "Rápido. Eso es mentalidad ganadora.",
        "Otros ya avanzaron más.",
        "Sigue. No te detengas."
    ])

    return {
        "feedback": feedback,
        "next_question": random.choice(questions_bank)
    }

# =========================
# CHAT
# =========================

class ChatMessage(BaseModel):
    token: str
    message: str

blocked_words = ["demanda", "abogado", "ilegal"]

@app.post("/chat")
async def send_chat(data: ChatMessage):
    if not verify_token(data.token):
        raise HTTPException(status_code=401)

    for word in blocked_words:
        if word in data.message.lower():
            return {"status": "blocked"}

    chat_messages.append(data.message)

    if len(chat_messages) > 50:
        chat_messages.pop(0)

    return {"status": "ok"}

@app.get("/chat")
async def get_chat(token: str):
    if not verify_token(token):
        raise HTTPException(status_code=401)

    return {"messages": chat_messages[-20:]}
