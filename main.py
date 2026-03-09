from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json5  # JSON tolerante a errores
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar sesiones
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    try:
        db = json5.load(f)
    except Exception as e:
        print("Error cargando JSON:", e)
        db = {"sesiones": []}

# Función para seleccionar la sesión del día (1 por día, no repetir hasta completar las 20)
def obtener_sesion():
    if not db.get("sesiones"):
        return {
            "apertura": "Contenido no disponible",
            "historia": "Contenido no disponible",
            "ejercicio": "Contenido no disponible",
            "respiracion": "Contenido no disponible",
            "visualizacion": "Contenido no disponible",
            "cierre": "Contenido no disponible"
        }
    # Guardar índice en archivo simple o localStorage del cliente
    # Aquí simulamos elegir la primera sesión disponible
    return db["sesiones"][0]  # siempre devuelve 1 por día

@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.get("/session_content")
async def session_content():
    sesion = obtener_sesion()
    return sesion
