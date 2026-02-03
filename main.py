import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import pytz
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Weather Integration (Usando tu servicio en Render o OpenWeather)
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def get_real_context(lat: float = None, lon: float = None):
    context = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "is_dark": datetime.now().hour > 18 or datetime.now().hour < 6,
        "weather": "clear",
        "temp": 20,
        "sentiment": "neutral"
    }
    if lat and lon:
        try:
            # Conexión al flujo real del clima
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            res = requests.get(url).json()
            context["weather"] = res["weather"][0]["main"].lower()
            context["temp"] = res["main"]["temp"]
            # Interpretación existencial del clima
            if context["weather"] in ["rain", "drizzle", "thunderstorm"]:
                context["sentiment"] = "melancholy" # El llanto de la tierra
            elif context["temp"] > 30:
                context["sentiment"] = "exhaustion" # El peso del sol
        except:
            pass
    return context

@app.get("/init_vital")
async def init_vital(lat: float = None, lon: float = None):
    ctx = get_real_context(lat, lon)
    return {
        "app": "KaMiZen",
        "context": ctx,
        "global_pulse": 8200451032, # Población mundial latiendo
        "levels": {"1": "Gratis - Prueba", "2": "Gratis - Prueba"}
    }

@app.get("/flow/{level}")
async def get_flow(level: int, lat: float = None, lon: float = None):
    ctx = get_real_context(lat, lon)
    # Nivel 2 es la profundidad absoluta: El miedo y la trascendencia
    return {
        "level": level,
        "atmosphere": ctx,
        "microactions": [
            {"t": "Hidratación", "m": "Tus células mueren sin agua. Bébetela ahora."},
            {"t": "Miedo", "m": "Esa presión en el pecho es solo energía. Suéltala."},
            {"t": "Conexión", "m": "Mil personas bajo esta misma lluvia están pensando en alguien."}
        ]
    }

app.mount("/sounds", StaticFiles(directory="sounds"), name="sounds")
