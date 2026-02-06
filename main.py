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

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

stripe.api_key = STRIPE_SECRET_KEY

# =========================
# APP
# =========================

app = FastAPI(title=APP_NAME)

app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# UTILIDADES IA
# =========================

def generate_ai_content() -> Dict:
    """
    Generador infinito de microcontenido.
    Si falla OpenAI → Gemini.
    Si fallan ambos → fallback interno.
    """

    now = datetime.datetime.now()
    hour = now.hour

    moods = [
        "calma", "misterio", "reflexión", "impulso",
        "silencio", "claridad", "curiosidad", "esperanza"
    ]

    mood = random.choice(moods)

    base_content = {
        "timestamp": now.isoformat(),
        "mood": mood,
        "colors": {
            "background": random.choice([
                "#0f2027", "#203a43", "#2c5364",
                "#1b1b1b", "#101820", "#2b1055"
            ]),
            "accent": random.choice([
                "#f5af19", "#f12711", "#00c6ff",
                "#7f00ff", "#38ef7d"
            ])
        },
        "animation": random.choice([
            "slow-fade", "breathing", "floating",
            "pulse", "drift"
        ]),
    }

    # =========================
    # INTENTO OPENAI
    # =========================
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)

            prompt = f"""
            Create a short reflective message for a human.
            Tone: warm, elegant, calm.
            Mood: {mood}
            Time of day: {hour}
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,
            )

            text = response.choices[0].message.content.strip()

            return {
                **base_content,
                "source": "openai",
                "text": text,
                "voice": {
                    "enabled": True,
                    "gender": random.choice(["female", "male"]),
                    "style": "soft"
                }
            }

        except Exception:
            pass

    # =========================
    # INTENTO GEMINI
    # =========================
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)

            model = genai.GenerativeModel("gemini-pro")

            prompt = f"""
            Write a gentle reflective micro-story.
            Emotional tone: {mood}
            """

            result = model.generate_content(prompt)

            return {
                **base_content,
                "source": "gemini",
                "text": result.text.strip(),
                "voice": {
                    "enabled": True,
                    "gender": random.choice(["female", "male"]),
                    "style": "soft"
                }
            }

        except Exception:
            pass

    # =========================
    # FALLBACK INTERNO
    # =========================
    fallback_texts = [
        "Respira. Nada te persigue ahora.",
        "Este segundo también cuenta.",
        "Lo que buscas ya empezó dentro de ti.",
        "No todo se mueve rápido. Y está bien.",
        "El silencio también responde."
    ]

    return {
        **base_content,
        "source": "internal",
        "text": random.choice(fallback_texts),
        "voice": {
            "enabled": False
        }
    }

# =========================
# RUTAS
# =========================

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>KaMiZen sintonizando tu momento…</h1>"

@app.get("/ai-content")
async def ai_content():
    return generate_ai_content()

# =========================
# STRIPE – CHECKOUT
# =========================

@app.post("/create-checkout")
async def create_checkout(request: Request):
    data = await request.json()
    plan = data.get("plan")

    if plan not in ["basic", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if plan == "basic":
        price_id = os.getenv("STRIPE_PRICE_BASIC")  # $1.69
    else:
        price_id = os.getenv("STRIPE_PRICE_PRO")    # $99

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price": price_id,
            "quantity": 1
        }],
        success_url=f"{BASE_URL}/?payment=success",
        cancel_url=f"{BASE_URL}/?payment=cancel",
    )

    return {"id": session.id}

# =========================
# SALUD
# =========================

@app.get("/health")
async def health():
    return {"status": "ok", "app": APP_NAME}
