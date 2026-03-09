from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json5
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# cargar sesiones
with open("static/kamizen_content.json","r",encoding="utf-8") as f:
    db = json5.load(f)

def obtener_sesion():
    return random.choice(db["sesiones"])

@app.get("/")
async def root():
    with open("static/session.html","r",encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.get("/session_content")
async def session_content():

    sesion = obtener_sesion()

    bloques = [
        sesion["apertura"],
        sesion["historia"],
        sesion["ejercicio"],
        sesion["respiracion"],
        sesion["visualizacion"],
        sesion["cierre"]
    ]

    return {"bloques": bloques}
