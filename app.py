from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import random
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables en Render
PREMIUM_USERS = os.getenv("PREMIUM_USERS", "").split(",")
RANDOM_GIFT_USER = os.getenv("RANDOM_GIFT_USER")
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

# --- INICIO / INIT ---
@app.get("/init")
async def init(user_id: str = "guest", lang: str = "es", lat: float = None, lon: float = None):
    now = datetime.now()
    stage = detect_stage(now)
    gift = check_random_gift(user_id)
    premium = user_id in PREMIUM_USERS
    return JSONResponse({
        "stage": stage,
        "is_premium": premium,
        "random_gift": gift,
        "lang": lang
    })

def detect_stage(now: datetime):
    hour = now.hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 18:
        return "afternoon"
    elif 18 <= hour < 21:
        return "evening"
    else:
        return "night"

def check_random_gift(user_id: str):
    return user_id == RANDOM_GIFT_USER

# --- NIVEL 1 ---
@app.get("/level1")
async def level1(user_id: str = "guest"):
    return JSONResponse({
        "landscape": generate_landscape(level=1),
        "sound": generate_sound(level=1)
    })

# --- NIVEL 2 ---
@app.get("/level2")
async def level2(user_id: str = "guest"):
    if user_id not in PREMIUM_USERS and user_id != RANDOM_GIFT_USER:
        return JSONResponse({"error": "No access to Level 2"}, status_code=403)
    return JSONResponse({
        "landscape": generate_landscape(level=2),
        "sound": generate_sound(level=2),
        "soft_exit_duration": 90
    })

# --- GENERADORES DE PAISAJE ---
def generate_landscape(level=1):
    stages = ["morning","afternoon","evening","night"]
    seasons = ["spring","summer","autumn","winter"]
    weather = ["sunny","cloudy","rainy","snowy"]
    return {
        "stage": random.choice(stages),
        "season": random.choice(seasons),
        "weather": random.choice(weather),
        "complexity": "high" if level==2 else "medium",
        "layers": 5 if level==2 else 3
    }

# --- GENERADOR DE SONIDO REAL ---
def generate_sound(level=1):
    if level == 1:
        return {
            "layers": [
                {"name":"ambient_light","volume":0.3,"loop":True}
            ]
        }
    else:
        return {
            "layers":[
                {"name":"base_grave","volume":0.5,"loop":True},
                {"name":"harmonics","volume":0.3,"loop":True},
                {"name":"pulse","volume":0.2,"loop":True},
                {"name":"environmental","volume":0.3,"loop":True},
                {"name":"breath","volume":0.2,"loop":True}
            ]
        }
