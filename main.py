from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json5  # <- usa json5 en vez de json
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar contenido desde JSON tolerante a errores
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    try:
        db = json5.load(f)  # json5 permite comas finales, comillas simples, etc.
    except Exception as e:
        print("Error cargando JSON:", e)
        db = {
            "historias": ["Contenido no disponible"],
            "historias_riqueza": ["Contenido no disponible"],
            "ejercicios": ["Contenido no disponible"],
            "bienestar": ["Contenido no disponible"],
            "cierres": ["Contenido no disponible"]
        }

# Función para obtener contenido aleatorio con fallback
def obtener_contenido(categoria):
    try:
        return random.choice(db.get(categoria, ["Sin contenido disponible"]))
    except Exception:
        return "Sin contenido disponible"

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
