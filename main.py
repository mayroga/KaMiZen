from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import random
import os

# Importaciones de tus módulos de base de datos y esquemas
from . import database, models, schemas, ai_engine, crud, services

# Inicializar base de datos
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="KaMiZen Engine")

# Configuración CORS para permitir conexión desde el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia de DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Lógica de Paisajes y Estados ---
def detect_stage():
    hour = datetime.now().hour
    if 5 <= hour < 12: return "morning"
    elif 12 <= hour < 18: return "afternoon"
    elif 18 <= hour < 21: return "evening"
    else: return "night"

def generate_landscape(level=1):
    seasons = ["spring", "summer", "autumn", "winter"]
    weather = ["sunny", "cloudy", "rainy", "snowy"]
    return {
        "stage": detect_stage(),
        "season": random.choice(seasons),
        "weather": random.choice(weather),
        "complexity": "high" if level == 2 else "medium",
        "layers": 5 if level == 2 else 3
    }

# --- Endpoints Principales ---

@app.get("/init")
async def init(user_id: str = "guest", lang: str = "es"):
    premium_users = os.getenv("PREMIUM_USERS", "").split(",")
    return {
        "stage": detect_stage(),
        "is_premium": user_id in premium_users,
        "random_gift": user_id == os.getenv("RANDOM_GIFT_USER"),
        "lang": lang,
        "app": "KaMiZen"
    }

@app.get("/level1")
async def level1(user_id: str = "guest"):
    return {
        "landscape": generate_landscape(level=1),
        "sound": {
            "layers": [{"name": "ambient_light", "volume": 0.3, "loop": True}]
        }
    }

@app.get("/level2")
async def level2(user_id: str = "guest"):
    # Aquí puedes añadir validación de premium si lo deseas
    return {
        "landscape": generate_landscape(level=2),
        "sound": {
            "layers": [
                {"name": "base_grave", "volume": 0.5, "loop": True},
                {"name": "harmonics", "volume": 0.3, "loop": True},
                {"name": "environmental", "volume": 0.3, "loop": True}
            ]
        },
        "soft_exit_duration": 90
    }

# --- Endpoints de Microacciones ---

@app.get("/microactions/{user_id}")
def get_actions(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_actions(db, user_id)

@app.post("/microactions/generate/{user_id}")
def generate_actions(user_id: int, db: Session = Depends(get_db)):
    actions = ai_engine.generate_daily_actions()
    created = []
    for a in actions:
        action_data = schemas.MicroActionCreate(
            user_id=user_id, action=a["action"], scheduled_at=a["scheduled_at"]
        )
        created.append(crud.create_microaction(db, action_data))
    return created

@app.get("/weather/{city}")
def weather(city: str):
    return services.get_weather(city)
