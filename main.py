import os
import uuid
import random
import stripe
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from jose import jwt, JWTError

# ================= CONFIG =================

SECRET_KEY = "kamizen-super-secret"
ALGORITHM = "HS256"
SESSION_LIMIT = 500
SESSION_DURATION = 10
PRICE = 999

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
BASE_URL = os.getenv("BASE_URL")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

# ================= MEMORY =================

active_users = set()
active_tokens = {}
connections = {}
user_progress = {}

# ================= QUESTIONS =================

PHASE_QUESTIONS = {
    1: [
        "¿Qué acción financiera ejecutarás en 24h?",
        "¿Qué ingreso activarás hoy?",
        "¿Qué decisión estás evitando?"
    ],
    2: [
        "¿Qué gasto cortarás esta semana?",
        "¿Qué sacrificio aceptarás?",
        "¿Qué distracción eliminarás?"
    ],
    3: [
        "¿Qué nivel financiero alcanzarás?",
        "¿Quién serás en 90 días?",
        "¿Qué te separa de los que ya ganan más?"
    ]
}

PLACEHOLDERS = [
    "Hoy ejecuto sin excusas.",
    "No me quedo atrás.",
    "Activo ingresos ahora.",
    "Disciplina total.",
    "Subiendo nivel."
]

BANNED_WORDS = ["garantizado", "cura", "demanda", "abogado", "compensación"]

# ================= TIME CONTROL =================

def session_window():
    now = datetime.utcnow()
    weekday = now.weekday()

    if weekday not in [0, 3]:
        return None, None

    start = now.replace(hour=20, minute=0, second=0, microsecond=0)
    end = start + timedelta(minutes=SESSION_DURATION)

    return start, end

def is_live():
    start, end = session_window()
    if not start:
        return False
    return start <= datetime.utcnow() <= end

def next_session():
    now = datetime.utcnow()
    days = [(0 - now.weekday()) % 7, (3 - now.weekday()) % 7]
    next_dates = []
    for d in days:
        dt = now + timedelta(days=d)
        dt = dt.replace(hour=20, minute=0, second=0, microsecond=0)
        if dt > now:
            next_dates.append(dt)
    return min(next_dates) if next_dates else now

# ================= TOKEN =================

def generate_token():
    payload = {
        "exp": datetime.utcnow() + timedelta(minutes=20),
        "id": str(uuid.uuid4())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token):
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return True
    except JWTError:
        return False

# ================= ROUTES =================

@app.get("/")
def landing():
    return FileResponse("static/index.html")

@app.get("/next-session")
def get_next():
    return {"next": next_session().isoformat()}

# ===== STRIPE =====

@app.post("/create-checkout")
def create_checkout():
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "KaMiZen Entry"},
                "unit_amount": PRICE,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=BASE_URL + "/success",
        cancel_url=BASE_URL,
    )
    return {"url": session.url}

@app.get("/success")
def success():
    if len(active_users) >= SESSION_LIMIT:
        raise HTTPException(status_code=403, detail="Cupo lleno")

    token = generate_token()
    active_tokens[token] = True
    return {"token": token}

# ===== ADMIN =====

@app.post("/admin-login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401)

    token = generate_token()
    active_tokens[token] = True
    return {"token": token}

# ===== SESSION PAGE =====

@app.get("/session")
def session_page(token: str = Query(...)):
    if not verify_token(token):
        raise HTTPException(status_code=403)

    if not is_live():
        raise HTTPException(status_code=403)

    active_users.add(token)
    return FileResponse("static/session.html")

# ===== AUDIO =====

@app.get("/audio-file")
def audio_file():
    weekday = datetime.utcnow().weekday()
    if weekday == 0:
        return {"file": "/audio/monday.mp3"}
    if weekday == 3:
        return {"file": "/audio/thursday.mp3"}
    return {"file": None}

# ===== QUESTIONS ENGINE =====

@app.get("/next-question")
def next_question(token: str):

    if not verify_token(token):
        raise HTTPException(status_code=403)

    start, _ = session_window()
    if not start:
        raise HTTPException(status_code=403)

    minutes_passed = (datetime.utcnow() - start).seconds // 60

    if minutes_passed < 3:
        phase = 1
    elif minutes_passed < 7:
        phase = 2
    else:
        phase = 3

    if token not in user_progress:
        user_progress[token] = {"answered": []}

    available = [
        q for q in PHASE_QUESTIONS[phase]
        if q not in user_progress[token]["answered"]
    ]

    if not available:
        available = PHASE_QUESTIONS[phase]

    question = random.choice(available)
    user_progress[token]["answered"].append(question)

    return {"phase": phase, "question": question}

# ===== WEBSOCKET CHAT =====

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    if not verify_token(token):
        await websocket.close()
        return

    await websocket.accept()
    connections[token] = websocket

    try:
        while True:
            data = await websocket.receive_json()
            msg = data.get("message")

            if any(b in msg.lower() for b in BANNED_WORDS):
                continue

            for conn in connections.values():
                await conn.send_json({"message": msg})

    except WebSocketDisconnect:
        connections.pop(token, None)

# ===== PLACEHOLDER ENGINE =====

async def placeholder_loop():
    while True:
        await asyncio.sleep(random.randint(8, 15))
        if is_live() and connections:
            fake = random.choice(PLACEHOLDERS)
            for conn in connections.values():
                await conn.send_json({"message": fake})

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(placeholder_loop())
