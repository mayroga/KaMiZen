import os
import random
from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

# Importaciones locales de tu estructura de archivos
from . import database, models, schemas, ai_engine, crud

# Inicialización de la base de datos
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="KaMiZen - Sistema Operativo de la Existencia")

# 1. CONFIGURACIÓN DE SEGURIDAD (CORS)
# Permite que tu Frontend en Render se comunique sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. GESTIÓN DE ARCHIVOS ESTÁTICOS (SONIDOS)
# Crea la carpeta si no existe y la expone al navegador
if not os.path.exists("sounds"):
    os.makedirs("sounds")

app.mount("/sounds", StaticFiles(directory="sounds"), name="sounds")

# Dependencia para la base de datos
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 3. LÓGICA VITAL Y DINÁMICA
def detect_stage():
    """Detecta el ciclo del día para adaptar el paisaje al entorno real."""
    hour = datetime.now().hour
    if 5 <= hour < 12: return "morning"
    elif 12 <= hour < 18: return "afternoon"
    elif 18 <= hour < 21: return "evening"
    else: return "night"

def get_landscape_config(level: int):
    """Genera la complejidad visual según el nivel de profundidad."""
    stage = detect_stage()
    seasons = ["primavera", "verano", "otoño", "invierno"]
    return {
        "stage": stage,
        "season": random.choice(seasons),
        "complexity": "transcendental" if level == 2 else "vital",
        "layers": 7 if level == 2 else 3,
        "timestamp": datetime.now().isoformat()
    }

# 4. ENDPOINTS PRINCIPALES

@app.get("/init")
async def init(user_id: str = "guest", lang: str = "es"):
    """Punto de entrada que despierta al sistema y valida al usuario."""
    premium_list = os.getenv("PREMIUM_USERS", "").split(",")
    return {
        "app": "KaMiZen",
        "status": "active",
        "stage": detect_stage(),
        "is_premium": user_id in premium_list or user_id == "guest", # Permitimos guest para pruebas
        "lang": lang,
        "message": "Bienvenido al ciclo."
    }

@app.get("/level1")
async def level1():
    """Nivel 1: Relajación inmediata y reconocimiento del entorno."""
    return {
        "landscape": get_landscape_config(level=1),
        "sound": {
            "layers": [
                {"name": "ambient_light", "volume": 0.4, "loop": True},
                {"name": "nature_whisper", "volume": 0.2, "loop": True}
            ]
        }
    }

@app.get("/level2")
async def level2(user_id: str = "guest"):
    """Nivel 2: Experiencia profunda, inmersión total en el ser."""
    return {
        "landscape": get_landscape_config(level=2),
        "sound": {
            "layers": [
                {"name": "base_grave", "volume": 0.6, "loop": True},
                {"name": "harmonics", "volume": 0.4, "loop": True},
                {"name": "celestial_echo", "volume": 0.3, "loop": True}
            ]
        },
        "immersion_mode": "deep",
        "transition_speed": "slow"
    }

# 5. MOTOR DE MICROACCIONES (Captura de la Vida)

@app.post("/microactions/generate/{user_id}")
def generate_actions(user_id: int, db: Session = Depends(get_db)):
    """Genera las microacciones diarias basadas en supervivencia y bienestar."""
    # El motor de IA genera acciones con sentido existencial
    actions_data = ai_engine.generate_daily_actions()
    
    created_actions = []
    for item in actions_data:
        new_action = schemas.MicroActionCreate(
            user_id=user_id,
            action=item["action"],
            scheduled_at=item["scheduled_at"]
        )
        created_actions.append(crud.create_microaction(db, new_action))
    
    return created_actions

@app.get("/microactions/{user_id}")
def get_user_actions(user_id: int, db: Session = Depends(get_db)):
    """Recupera el flujo de acciones del usuario."""
    return crud.get_user_actions(db, user_id)

# 6. MONETIZACIÓN E INSIGHTS (Eslabón Perdido)
@app.get("/analytics/global-pulse")
async def global_pulse():
    """Simula la coordinación global de microacciones (dato agregado)."""
    return {
        "active_breaths": random.randint(10000, 50000),
        "hydration_sync": True,
        "global_calm_index": 0.85
    }

# Montar el frontend (solo si se ha generado la carpeta dist)
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="frontend")
