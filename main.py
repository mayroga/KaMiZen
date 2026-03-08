from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import random

app = FastAPI(title="AURA NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA_FILE = "session_data.json"

# --- BASE DE DATOS (AQUÍ RELLENARÁS LAS 300 FRASES) ---
db = {
    "historias": ["Frase éxito 1", "Frase éxito 2"], # Rellenar hasta 100
    "ejercicios": ["Reto 1", "Reto 2"],             # Rellenar hasta 100
    "bienestar": ["Consejo 1", "Consejo 2"]         # Rellenar hasta 100
}

# --- MOTOR DE PERSISTENCIA ---
def cargar_historial():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f: return json.load(f)
        except: return {}
    return {}

def guardar_historial(historial):
    with open(DATA_FILE, "w") as f: json.dump(historial, f)

def obtener_siguiente_contenido(user_id, categoria):
    historial = cargar_historial()
    if user_id not in historial:
        historial[user_id] = {"historias": [], "ejercicios": [], "bienestar": []}
    
    vistas = historial[user_id][categoria]
    disponibles = [item for item in db[categoria] if item not in vistas]
    
    if not disponibles:
        historial[user_id][categoria] = []
        disponibles = db[categoria]
        
    seleccion = random.choice(disponibles)
    historial[user_id][categoria].append(seleccion)
    guardar_historial(historial)
    return seleccion

# --- GESTOR DE CONEXIONES ---
class Manager:
    def __init__(self): self.connections = {}
    async def connect(self, ws: WebSocket, uid: str):
        await ws.accept()
        self.connections[uid] = ws
    def disconnect(self, uid: str):
        if uid in self.connections: del self.connections[uid]

manager = Manager()

# --- ENDPOINT WEBSOCKET ---
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(ws: WebSocket, user_id: str):
    await manager.connect(ws, user_id)
    
    # Enviar contenido único del día
    contenido = {
        "historia": obtener_siguiente_contenido(user_id, "historias"),
        "ejercicio": obtener_siguiente_contenido(user_id, "ejercicios"),
        "bienestar": obtener_siguiente_contenido(user_id, "bienestar")
    }
    
    await ws.send_json({"type": "init", "content": contenido})
    
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())
