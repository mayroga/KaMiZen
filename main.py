import os
import random
import datetime
from typing import Dict

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import stripe

# =========================
# CONFIGURACIÓN GENERAL
# =========================
APP_NAME = "KaMiZen"
BASE_URL = os.getenv("BASE_URL", "https://kamizen.onrender.com")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
stripe.api_key = STRIPE_SECRET_KEY

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# =========================
# APP
# =========================
app = FastAPI(title=APP_NAME)
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# UTILIDADES
# =========================

def get_weather():
    """Retorna info de clima simulada (puedes integrar Weather API real)"""
    return random.choice(["soleado", "nublado", "lluvioso", "ventoso", "nevado"])

def generate_ai_text(hour:int, weather:str, mood:str, chapter:int) -> str:
    """Genera narrativa adaptativa usando IA (OpenAI/Gemini/fallback)"""
    base_messages = [
        "Respira, nada te persigue ahora.",
        "Cada momento es un regalo silencioso.",
        "Lo que buscas ya empezó dentro de ti.",
        "El cambio ocurre incluso en silencio.",
        "Observa. Todo se mueve sin que hagas nada."
    ]

    # Intento OpenAI
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            prompt = f"""
            Genera un mensaje corto de sabiduría, relajación y consejo,
            adaptado a la hora {hour}, clima {weather}, mood {mood}, capítulo {chapter}.
            Tono cálido, elegante y calmado.
            """
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )
            text = response.choices[0].message.content.strip()
            return text
        except Exception:
            pass

    # Intento Gemini
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-pro")
            prompt = f"Escribe un mensaje breve de sabiduría y relajación para capítulo {chapter}, hora {hour}, clima {weather}."
            result = model.generate_content(prompt)
            return result.text.strip()
        except Exception:
            pass

    # Fallback interno
    return random.choice(base_messages)

def get_canvas_for_chapter(chapter:int) -> Dict:
    """Devuelve colores y animaciones según capítulo"""
    if chapter == 1:
        return {"background":"#0f2027","accent":"#f5af19","animation":"slow-fade"}
    if chapter == 2:
        return {"background":"#0b132b","accent":"#00c6ff","animation":"floating"}
    if chapter == 3:
        return {"background":"#001219","accent":"#38ef7d","animation":"pulse"}
    return {"background":"#000","accent":"#fff","animation":"drift"}

# =========================
# RUTAS
# =========================

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open("templates/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>KaMiZen preparando tu experiencia…</h1>"

@app.get("/ai-content")
async def ai_content(user_id:str = None):
    """Retorna JSON con capítulo, texto y configuración de canvas adaptativa"""
    now = datetime.datetime.now()
    hour = now.hour
    weather = get_weather()

    # Decide capítulo según hora
    if 5 <= hour < 12:
        chapter = 1
        mood = "calma"
    elif 12 <= hour < 18:
        chapter = 2
        mood = "reflexión"
    else:
        chapter = 3
        mood = "descanso"

    text = generate_ai_text(hour, weather, mood, chapter)
    canvas_config = get_canvas_for_chapter(chapter)

    return {
        "chapter": chapter,
        "text": text,
        "canvas": canvas_config,
        "voice": {"enabled": True, "gender":"female", "style":"soft"}
    }

# =========================
# MICROACCIONES
# =========================
@app.post("/microaction")
async def microaction(request: Request):
    form = await request.form()
    user_id = form.get("user_id")
    action = form.get("action")
    print(f"[MICROACTION] User {user_id} -> {action}")
    return JSONResponse({"status":"ok","user":user_id,"action":action})

# =========================
# STRIPE CHECKOUT
# =========================
@app.post("/create-checkout")
async def create_checkout(request: Request):
    data = await request.json()
    plan = data.get("plan")
    if plan not in ["basic","pro"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    price_id = os.getenv("STRIPE_PRICE_BASIC") if plan=="basic" else os.getenv("STRIPE_PRICE_PRO")
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id,"quantity":1}],
        success_url=f"{BASE_URL}/?payment=success",
        cancel_url=f"{BASE_URL}/?payment=cancel",
    )
    return {"id": session.id}

# =========================
# SALUD
# =========================
@app.get("/health")
async def health():
    return {"status":"ok","app":APP_NAME}
