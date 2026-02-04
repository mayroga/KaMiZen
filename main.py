import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
from typing import List
from pydantic import BaseModel
import random

app = FastAPI(title="KaMiZen PRO - Sistema de Acompañamiento Vital")

# Permitir CORS para React Front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# MODELOS SIMPLES
# ----------------------
class MicroAction(BaseModel):
    id: int
    action: str
    scheduled_at: datetime
    done: bool = False

class User(BaseModel):
    id: int
    name: str
    nivel: str = "BÁSICO"  # BÁSICO o PRO
    microacciones: List[MicroAction] = []

# ----------------------
# BASE DE DATOS SIMULADA
# ----------------------
USERS_DB = {
    1: User(id=1, name="Explorador del Ciclo", nivel="BÁSICO", microacciones=[])
}

# ----------------------
# ESTADOS VITALES
# ----------------------
ESTADOS = {
    "Fuego": "Alta energía, estrés o ansiedad. Necesitas enfriarte.",
    "Tierra": "Estancamiento o pesadez. Necesitas moverte.",
    "Aire": "Dispersión. Necesitas enfoque y respiración.",
    "Equilibrio": "Conexión óptima con tu entorno y bienestar."
}

# ----------------------
# ENDPOINTS
# ----------------------

@app.get("/sensor_completo")
async def sensor_completo(
    user_id: int = 1,
    pasos: int = 0,
    vasos_agua: int = 0,
):
    now = datetime.now(pytz.timezone("America/New_York"))

    # Lógica de estado vital simulada
    if pasos < 1000 and now.hour > 10:
        estado_actual = "Fuego"
    elif vasos_agua >= 8 and pasos > 5000:
        estado_actual = "Equilibrio"
    else:
        estado_actual = random.choice(["Aire", "Tierra"])

    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "timestamp": now.isoformat(),
        "hora_local": now.strftime("%H:%M:%S"),
        "clima": "Soleado" if now.hour < 18 else "Estrellado",
        "estado_vital": estado_actual,
        "descripcion": ESTADOS[estado_actual],
        "metricas": {
            "hidratacion": f"{vasos_agua}/8 vasos",
            "movimiento": f"{pasos} pasos",
            "conexion_entorno": f"{random.randint(70, 100)}% - Sincronizado"
        },
        "nivel_usuario": user.nivel
    }

@app.get("/nivel")
async def get_nivel(user_id: int = 1):
    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Desbloqueo automático de nivel PRO si cumple criterios (simulado)
    if user.nivel == "BÁSICO" and random.random() > 0.7:
        user.nivel = "PRO"
    
    return {"nivel": user.nivel}

@app.get("/microacciones")
async def get_microacciones(user_id: int = 1):
    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Si no tiene microacciones, generar para hoy
    if len(user.microacciones) == 0:
        user.microacciones = [
            MicroAction(id=i, action=act, scheduled_at=datetime.now().replace(hour=hour))
            for i, (act, hour) in enumerate([
                ("Beber agua: hidrátate naturalmente", 8),
                ("Mini-movimiento: estírate y respira", 10),
                ("Momento de silencio y risoterapia corta", 13),
                ("Pequeño paseo: conecta con entorno", 17),
                ("Preparar comida saludable disponible", 20)
            ])
        ]
    return user.microacciones

@app.post("/microaccion_done/{user_id}/{micro_id}")
async def marcar_microaccion(user_id: int, micro_id: int):
    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    for m in user.microacciones:
        if m.id == micro_id:
            m.done = True
            return {"status": "ok", "microaccion": m.dict()}
    raise HTTPException(status_code=404, detail="Microacción no encontrada")

@app.get("/reporte_vital_data")
async def reporte_vital(user_id: int = 1):
    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    completadas = [m.action for m in user.microacciones if m.done]
    return {
        "titulo": "REPORTE DE CICLO VITAL - KaMiZen",
        "usuario": user.name,
        "nivel": user.nivel,
        "microacciones_completadas": completadas,
        "resumen_24h": f"Hoy completaste {len(completadas)}/{len(user.microacciones)} microacciones. Nivel: {user.nivel}.",
        "nota_legal": "Guía de bienestar personal, no constituye diagnóstico ni tratamiento médico."
    }
