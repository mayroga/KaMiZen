from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json5
import random
import os

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar sesiones
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    try:
        db = json5.load(f)
    except Exception as e:
        print("Error cargando JSON:", e)
        db = {"sesiones": []}

LAST_SESSION_FILE = "last_session.txt"

# Función para seleccionar la sesión del día (1 por día)
def obtener_sesion():
    if not db.get("sesiones"):
        return { 
            "apertura": "Contenido no disponible",
            "historia": "Contenido no disponible",
            "ejercicio": "Contenido no disponible",
            "respiracion": "Contenido no disponible",
            "visualizacion": "Contenido no disponible",
            "cierre": "Contenido no disponible",
            "juego": {"pregunta": "No disponible", "respuesta": "No disponible"}
        }
    
    total = len(db["sesiones"])
    if os.path.exists(LAST_SESSION_FILE):
        with open(LAST_SESSION_FILE, "r") as f:
            idx = int(f.read())
            idx = (idx + 1) % total
    else:
        idx = 0

    with open(LAST_SESSION_FILE, "w") as f:
        f.write(str(idx))

    return db["sesiones"][idx]

@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.get("/session_content")
async def session_content():
    sesion = obtener_sesion()
    return sesion
