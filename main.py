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

stripe.api_key = STRIPE_SECRET_KEY

# ================== APP ==================
app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ================== REGISTRO ==================
microactions_db = {}
users_db = {}

# ================== AI INFINITA ==================
ai_cache = {}  # {user_id: {"last_generated": datetime, "content": [items]}}

def generate_ai_content(context: str, n_items: int = 20):
    """
    Genera historias, frases, desafíos, cuentos, consejos, traducciones y voces.
    Usa OpenAI y Gemini como fallback.
    """
    seed = hashlib.sha256(f"{context}{random.random()}".encode()).hexdigest()
    prompt = f"""
    KaMiZen AI Content Generation
    Contexto: {context}
    Genera {n_items} items variados:
    - Frases motivacionales y consejos diarios
    - Mini historias y cuentos basados en hechos reales
    - Microdesafíos de mente y cuerpo
    - Preguntas para reflexión y curiosidad
    - Traducción inmediata a todos los idiomas soportados
    - Guía de voz TTS (suave, cálida, masculina/femenina, niño/niña)
    - Cambios de color, figuras y animaciones sugeridas para frontend
    - Inclusión de misterio sutil y elementos de sorpresa
    Cada item debe ser único, creativo y nunca repetido.
    Identificador único: {seed}
    """
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages":[{"role":"user","content":prompt}],
                "temperature":0.9,
                "max_tokens":1000
            },
            timeout=15
        )
        data = r.json()
        items = data["choices"][0]["message"]["content"].split("\n")
        return items
    except:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
            json={"contents":[{"parts":[{"text":prompt}]}]},
            timeout=15
        )
        data = r.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.split("\n")

async def refresh_ai_cache(user_id: str):
    context = get_context(user_id)
    ai_items = generate_ai_content(context, n_items=50)
    ai_cache[user_id] = {"last_generated": datetime.datetime.now(), "content": ai_items}

# ================== CONTEXTO ==================
def get_context(user_id: str):
    now = datetime.datetime.now()
    hour = now.hour
    weather_data = requests.get(
        f"http://api.openweathermap.org/data/2.5/weather?q=Miami&appid={WEATHER_API_KEY}&units=metric"
    ).json()
    temp = weather_data.get("main", {}).get("temp", 25)
    humidity = weather_data.get("main", {}).get("humidity", 50)
    wind = weather_data.get("wind", {}).get("speed", 0)
    context = {
        "datetime": str(now),
        "hour": hour,
        "temp": temp,
        "humidity": humidity,
        "wind": wind,
        "user_microactions": microactions_db.get(user_id, []),
        "user_preferences": users_db.get(user_id, {}).get("preferencias", {})
    }
    return json.dumps(context)

# ================== RUTAS ==================
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    user_id = request.client.host
    if user_id not in users_db:
        users_db[user_id] = {"nivel":1, "preferencias":{}, "idioma":"es"}
    return templates.TemplateResponse("index.html", {
        "request": request,
        "stripe_key": STRIPE_PUBLISHABLE_KEY
    })

@app.post("/microaction")
def add_microaction(user_id: str = Form(...), action: str = Form(...)):
    if user_id not in microactions_db:
        microactions_db[user_id] = []
    microactions_db[user_id].append({"action": action, "timestamp": str(datetime.datetime.now())})
    return {"status": "ok"}

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
                "recurring": {"interval": "month"}
            },
            "quantity": 1
        }],
        success_url="/?pro=1",
        cancel_url="/"
    )
    return {"id": session.id}

@app.get("/ai-content")
async def get_ai_content(user_id: str):
    """
    Retorna contenido generado dinámico infinito para el usuario.
    Genera nuevo contenido cada minuto.
    """
    now = datetime.datetime.now()
    cache = ai_cache.get(user_id)
    if not cache or (now - cache["last_generated"]).seconds > 60:
        await refresh_ai_cache(user_id)
    return JSONResponse({"items": ai_cache[user_id]["content"]})
