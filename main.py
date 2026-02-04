from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

# Permitir que React acceda a FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, poner solo tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datos simulados para prueba, listo para reemplazar con DB real
ESTADOS = {
    "Fuego": "Alta energía, ansiedad o estrés. Necesidad de enfriamiento.",
    "Tierra": "Estancamiento o pesadez. Necesidad de movimiento.",
    "Aire": "Dispersión. Necesidad de enfoque y respiración.",
    "Equilibrio": "Conexión óptima entre cuerpo y entorno."
}

MICROACCIONES = [
    {"id": 1, "action": "Beber agua", "scheduled_at": datetime.now(), "done": False},
    {"id": 2, "action": "Respirar profundo 1 minuto", "scheduled_at": datetime.now(), "done": False},
    {"id": 3, "action": "Pequeña caminata", "scheduled_at": datetime.now(), "done": False},
]

@app.get("/sensor_completo")
def sensor_completo(pasos: int = 0, vasos_agua: int = 0):
    now = datetime.now()
    if pasos < 1000:
        estado_actual = "Fuego"
    elif vasos_agua >= 8:
        estado_actual = "Equilibrio"
    else:
        estado_actual = "Aire"

    return {
        "timestamp": now.isoformat(),
        "hora_local": now.strftime("%H:%M:%S"),
        "estado_vital": estado_actual,
        "descripcion": ESTADOS[estado_actual],
        "metricas": {
            "hidratacion": f"{vasos_agua}/8 vasos",
            "movimiento": f"{pasos} pasos",
            "conexion_entorno": "85% - Sincronizado"
        },
        "nivel_usuario": "Nivel 1"  # Cambiar dinámicamente luego
    }

@app.get("/microacciones")
def get_microacciones():
    # Simuladas, luego conectar a DB real
    return MICROACCIONES

@app.get("/reporte_vital_data")
def reporte_vital_data():
    return {
        "usuario": "Explorador KaMiZen",
        "nivel": "Nivel 1",
        "microacciones_completadas": [m["action"] for m in MICROACCIONES if m["done"]]
    }
