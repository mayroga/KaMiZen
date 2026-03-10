from fastapi import FastAPI, Request, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json, os
import stripe
from datetime import datetime, date, time, timedelta
import pytz

# ===========================
# CONFIGURACIÓN GENERAL
# ===========================
APP_URL = "https://kamizen.onrender.com"

MIAMI_TZ = pytz.timezone("America/New_York")

SESSION_LIMIT = 600
PRICE_AMOUNT = 1099  # 10.99 USD
SESSION_DURATION_SECONDS = 945  # 15 min 45 seg

# ===========================
# VARIABLES DE ENTORNO (ADMIN + STRIPE)
# ===========================
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if not STRIPE_SECRET_KEY:
    print("⚠️ Stripe no configurado correctamente")

stripe.api_key = STRIPE_SECRET_KEY

# ===========================
# APP
# ===========================
app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===========================
# CARGAR CONTENIDO
# ===========================
CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        print("Error cargando JSON:", e)
        return {"sesiones": []}

db = load_content()

# ===========================
# CONTROL DE USUARIOS
# ===========================
session_users = {}

# ===========================
# SESIÓN DIARIA
# ===========================
START_DATE = date(2026, 3, 9)  # fecha inicial

def get_today_index():
    today = datetime.now(MIAMI_TZ).date()
    diff = (today - START_DATE).days
    total = len(db["sesiones"])
    return diff % total if total > 0 else 0

def get_session_type():
    now = datetime.now(MIAMI_TZ)
    ten_am = time(10,0)
    three_pm = time(15,0)
    if now.time() >= three_pm:
        return "repeticion"
    return "normal"

def get_current_session():
    index = get_today_index()
    if index >= len(db["sesiones"]):
        return {}
    return db["sesiones"][index]

# ===========================
# HORARIO DE SIGUIENTE SESIÓN
# ===========================
def next_session_time():
    now = datetime.now(MIAMI_TZ)
    ten = datetime.combine(now.date(), time(10,0))
    ten = MIAMI_TZ.localize(ten)
    if now < ten:
        return ten
    return ten + timedelta(days=1)

# ===========================
# RUTAS
# ===========================
@app.get("/", response_class=HTMLResponse)
async def root():
    try:
        with open("static/session.html","r",encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando session.html: {e}</h1>")

# ===========================
# LOGIN ADMIN
# ===========================
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return JSONResponse({"admin": True})
    raise HTTPException(status_code=401, detail="Usuario o contraseña incorrecta")

# ===========================
# CONTENIDO DE SESIÓN
# ===========================
@app.get("/session_content")
async def session_content(request: Request, admin_key: str = None):
    today = datetime.now(MIAMI_TZ).date()
    key = today.isoformat()

    # Acceso admin: siempre puede ver la sesión
    if admin_key == ADMIN_PASSWORD:
        sesion = get_current_session()
        return {
            "sesion": sesion,
            "tipo": "admin",
            "stripe_key": STRIPE_PUBLISHABLE_KEY,
            "duracion": SESSION_DURATION_SECONDS
        }

    # Limite de usuarios normales
    count = session_users.get(key, 0)
    if count >= SESSION_LIMIT:
        raise HTTPException(status_code=429, detail="Sesion llena")
    session_users[key] = count + 1

    # Revisar cancelación de pago
    canceled = request.query_params.get("canceled")
    if canceled == "true":
        return {
            "sesion": None,
            "tipo": "cancelada",
            "mensaje": "No se otorgará sesión por cancelación del pago"
        }

    sesion = get_current_session()
    tipo = get_session_type()

    return {
        "sesion": sesion,
        "tipo": tipo,
        "stripe_key": STRIPE_PUBLISHABLE_KEY,
        "duracion": SESSION_DURATION_SECONDS
    }

# ===========================
# CREAR SESIÓN DE PAGO STRIPE
# ===========================
@app.post("/create_checkout_session")
async def create_checkout_session():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe no configurado")

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Sesion KaMiZen diaria"},
                    "unit_amount": PRICE_AMOUNT
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{APP_URL}?success=true",
            cancel_url=f"{APP_URL}?canceled=true"  # NO se da sesión si cancelan
        )
        return {"id": checkout_session.id}
    except Exception as e:
        return JSONResponse({"error": str(e)})

# ===========================
# STRIPE WEBHOOK
# ===========================
@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig,
            STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print("Pago recibido:", session["id"])
    return {"status":"ok"}

# ===========================
# DEBUG
# ===========================
@app.get("/debug")
async def debug():
    now = datetime.now(MIAMI_TZ)
    return {
        "hora_miami": now.isoformat(),
        "indice": get_today_index(),
        "tipo_sesion": get_session_type(),
        "total_sesiones": len(db["sesiones"]),
        "usuarios_hoy": session_users.get(now.date().isoformat(),0)
    }

# ===========================
# HEALTH CHECK
# ===========================
@app.get("/health")
async def health():
    return {"status":"running"}
