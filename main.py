import os, random, hashlib, datetime, json, asyncio
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import stripe
import requests

# ================== VARIABLES RENDER ==================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_HOST = os.getenv("POSTGRES_HOST")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")

stripe.api_key = STRIPE_SECRET_KEY

# ================== APP ==================
app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ================== DATABASE SIMULADO ==================
# Aquí puedes reemplazar con PostgreSQL real usando asyncpg o SQLAlchemy
user_habits_db = {}  # usuario -> lista de microacciones
user_preferences_db = {}  # usuario -> preferencias

# ================== FUNCIONES AUXILIARES ==================
def is_admin(user: str, pwd: str):
    return user == ADMIN_USERNAME and pwd == ADMIN_PASSWORD

def get_user_context(user: str):
    now = datetime.datetime.now()
    hour = now.hour
    day = now.day
    month = now.month
    weekday = now.weekday()
    city = "Miami"
    weather = {}
    try:
        r = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric", timeout=3
        )
        data = r.json()
        weather["temp"] = data.get("main", {}).get("temp", 25)
        weather["humidity"] = data.get("main", {}).get("humidity", 60)
        weather["wind"] = data.get("wind", {}).get("speed", 5)
        weather["condition"] = data.get("weather", [{}])[0].get("description", "clear sky")
    except:
        weather = {"temp":25,"humidity":60,"wind":5,"condition":"clear sky"}

    preferences = user_preferences_db.get(user, {"hydration":True,"movement":True,"mindfulness":True})
    return {
        "hour": hour,
        "day": day,
        "month": month,
        "weekday": weekday,
        "weather": weather,
        "preferences": preferences
    }

def generate_ai_landscape(context: dict):
    # Prompt dinámico con semilla única para irrepetibilidad
    seed = hashlib.sha256(f"{context}{random.random()}".encode()).hexdigest()
    prompt = f"""
    KaMiZen: Sistema integral de acompañamiento de la vida humana.
    Paisaje natural dinámico adaptado al usuario.
    Hora:{context['hour']}, Día:{context['day']}, Mes:{context['month']}
    Condición climática:{context['weather']['condition']}, Temperatura:{context['weather']['temp']}°C
    Preferencias de usuario:{json.dumps(context['preferences'])}
    Generar visualización inmersiva irrepetible, efectos de luz, amanecer, atardecer, noche estrellada, lluvia, nieve, viento.
    Audio ambiental de alta fidelidad opcional.
    Semilla única: {seed}
    """
    # Intento OpenAI
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model":"gpt-4o-mini",
                "messages":[{"role":"user","content":prompt}]
            },
            timeout=5
        )
        return r.json()["choices"][0]["message"]["content"]
    except:
        # Fallback Gemini
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
                json={"contents":[{"parts":[{"text":prompt}]}]},
                timeout=5
            )
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]
        except:
            # Fallback plantilla
            return f"Paisaje natural KaMiZen generico adaptado a la hora {context['hour']} y clima {context['weather']['condition']}"

def register_microaction(user: str, action: str):
    if user not in user_habits_db:
        user_habits_db[user] = []
    user_habits_db[user].append({"action": action, "timestamp": datetime.datetime.now().isoformat()})

def generate_recommendations(user: str):
    context = get_user_context(user)
    recs = []
    if context['preferences'].get("hydration",True):
        recs.append("Recuerda hidratarte con agua fresca.")
    if context['preferences'].get("movement",True):
        recs.append("Tómate un pequeño descanso para moverte y estirarte.")
    if context['preferences'].get("mindfulness",True):
        recs.append("Respira profundamente y haz una pausa de atención plena.")
    recs.append("Disfruta de tu paisaje KaMiZen personalizado.")
    return recs

# ================== ROUTES ==================
@app.get("/", response_class=HTMLResponse)
def home(request: Request, user: str = "guest"):
    context = get_user_context(user)
    landscape = generate_ai_landscape(context)
    recommendations = generate_recommendations(user)
    return templates.TemplateResponse("index.html", {
        "request": request,
        "user": user,
        "ai_landscape": landscape,
        "recommendations": recommendations,
        "stripe_key": STRIPE_PUBLISHABLE_KEY
    })

@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if not is_admin(username, password):
        raise HTTPException(status_code=403)
    return {"status":"admin"}

@app.post("/microaction")
def add_microaction(user: str = Form(...), action: str = Form(...)):
    register_microaction(user, action)
    return {"status":"ok"}

@app.get("/report")
def user_report(user: str):
    actions = user_habits_db.get(user, [])
    return {"total_actions":len(actions),"actions":actions}

@app.post("/create-checkout-session")
def create_checkout():
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "KaMiZen PRO"},
                "unit_amount": 9900,
                "recurring": {"interval":"month"}
            },
            "quantity":1
        }],
        success_url="/?pro=1",
        cancel_url="/"
    )
    return {"id":session.id}
