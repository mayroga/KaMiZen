from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar contenido desde archivo JSON
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    db = json.load(f)

# Función para obtener contenido aleatorio
def obtener_contenido(categoria):
    return random.choice(db[categoria])

# Endpoint principal
@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# Endpoint para obtener contenido de sesión
@app.get("/session_content")
async def session_content():
    contenido = {
        "historia": obtener_contenido("historias"),
        "historia_riqueza": obtener_contenido("historias_riqueza"),
        "ejercicio": obtener_contenido("ejercicios"),
        "bienestar": obtener_contenido("bienestar"),
        "cierre": obtener_contenido("cierres")
    }
    return contenido
