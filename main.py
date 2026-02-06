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
    now = datetime.datetime.now()
    hour = now.hour

    moods = ["calma", "misterio", "reflexión", "impulso", "silencio", "claridad", "curiosidad", "esperanza"]
    mood = random.choice(moods)

    base_content = {
        "timestamp": now.isoformat(),
        "mood": mood,
        "colors": {
            "background": random.choice(["#0f2027", "#203a43", "#2c5364", "#1b1b1b", "#101820", "#2b1055"]),
            "accent": random.choice(["#f5af19", "#f12711", "#00c6ff", "#7f00ff", "#38ef7d"])
        },
        "animation": random.choice(["slow-fade", "breathing", "floating", "pulse", "drift"]),
    }

    # =========================
    # OPENAI
    # =========================
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            prompt = f"Create a short reflective message. Tone: warm, calm. Mood: {mood}. Hour: {hour}"
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,
            )
            text = response.choices[0].message.content
