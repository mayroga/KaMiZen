from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import random
import os

# Importaciones locales (asegúrate de que existan database, models, schemas, ai_engine)
from . import database, models, schemas, ai_engine, crud

database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="KaMiZen Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- LÓGICA DE ESTADO Y PAISAJE ---
def detect_stage():
    hour = datetime.now().hour
    if 5 <= hour < 12: return "morning"
    elif 12 <= hour < 18: return "afternoon"
    elif 18 <= hour < 21: return "evening"
    else: return "night"

def generate_landscape_data(level=1):
    return {
        "stage": detect_stage(),
        "season": random.choice(["spring", "summer", "autumn", "winter"]),
        "weather": random.choice(["sunny", "cloudy", "rainy"]),
        "layers": 5 if level == 2 else 3
    }

# --- ENDPOINTS ---

@app.get("/init")
async def init(user_id: str = "guest", lang: str = "es"):
    return {
        "stage": detect_stage(),
        "is_premium": user_id in os.getenv("PREMIUM_USERS", "").split(","),
        "lang": lang,
        "app_name": "KaMiZen"
    }

@app.get("/level1")
async def level1():
    return {
        "landscape": generate_landscape_data(level=1),
        "sound": {"layers": [{"name": "ambient_light", "volume": 0.3, "loop": True}]}
    }

@app.get("/level2")
async def level2(user_id: str = "guest"):
    # Lógica de acceso para nivel profundo
    return {
        "landscape": generate_landscape_data(level=2),
        "sound": {
            "layers": [
                {"name": "base_grave", "volume": 0.5, "loop": True},
                {"name": "environmental", "volume": 0.3, "loop": True}
            ]
        }
    }

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
