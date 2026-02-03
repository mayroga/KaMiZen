import os
import random
from fastapi import FastAPI, Depends
from datetime import datetime
import pytz
from typing import List

app = FastAPI()

# Diccionario de Estados Vitales (El Espejo del Usuario)
ESTADOS = {
    "Fuego": "Estado de alta energía, ansiedad o estrés. Necesidad de enfriamiento.",
    "Tierra": "Estado de estancamiento o pesadez. Necesidad de movimiento.",
    "Aire": "Estado de dispersión. Necesidad de enfoque y respiración.",
    "Equilibrio": "Estado óptimo de conexión entre el cuerpo y el entorno."
}

@app.get("/sensor_completo")
async def sensor_completo(lat: float = None, lon: float = None, pasos: int = 0, vasos_agua: int = 0):
    now = datetime.now()
    # Lógica de Estado Vital Automática (Simulada para el sensor)
    # Si hay poco movimiento y mucha hora de trabajo -> Fuego o Tierra
    if pasos < 1000 and now.hour > 10:
        estado_actual = "Fuego"
    elif vasos_agua >= 8 and pasos > 5000:
        estado_actual = "Equilibrio"
    else:
        estado_actual = "Aire"

    return {
        "timestamp": now.isoformat(),
        "hora_local": now.strftime("%H:%M:%S"),
        "clima": "Soleado" if now.hour < 18 else "Estrellado", # Aquí se conectaría tu API Weather
        "estado_vital": estado_actual,
        "descripcion": ESTADOS[estado_actual],
        "metricas": {
            "hidratacion": f"{vasos_agua}/8 vasos",
            "movimiento": f"{pasos} pasos",
            "conexion_entorno": "85% - Sincronizado"
        }
    }

# Endpoint para generar el Reporte Vital PDF (Estructura de datos)
@app.get("/reporte_vital_data")
async def reporte_vital_data():
    # Este endpoint entrega los datos que el PDF usará
    return {
        "titulo": "REPORTE DE CICLO VITAL - KaMiZen",
        "usuario": "Explorador del Ciclo",
        "resumen_24h": "Hoy pasaste de un estado de Fuego a un estado de Equilibrio. Tu hidratación fue óptima.",
        "puntos_clave": [
            "Conexión con el entorno aumentó un 20% al atardecer.",
            "Ritmo circadiano mantenido.",
            "Microacciones completadas: 12/15."
        ],
        "nota_legal": "Este documento es una guía de bienestar personal, no constituye un diagnóstico médico."
    }
