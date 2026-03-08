from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json
import os

app = FastAPI(title="KaMiZen NeuroGame Engine")

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
ranking = []

# -----------------------------
# RUTAS
# -----------------------------
@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# -----------------------------
# GENERADOR DE RETOS (fallback)
# -----------------------------
def generate_fallback_challenge():
    challenges = [
        {"question":"🎯 Matemática: ¿Cuánto es 3 + 4?", "answer":"7"},
        {"question":"🧩 Adivinanza: Blanco por dentro, verde por fuera. ¿Qué es?", "answer":"pera"},
        {"question":"💡 Mini historia: Respira y toma acción inmediata. Enseñanza: cada minuto cuenta", "answer":""},
        {"question":"🔥 Poder: ¿Qué harías hoy para mejorar tu nivel de energía?", "answer":""}
    ]
    return random.choice(challenges)

# -----------------------------
# MANAGER DE CONEXIONES
# -----------------------------
class Manager:
    def __init__(self):
        self.connections = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        await self.broadcast_participants()

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, data):
        for c in self.connections:
            try:
                await c.send_text(json.dumps(data))
            except:
                pass

    async def broadcast_participants(self):
        await self.broadcast({
            "type": "update_participants",
            "count": len(self.connections),
            "max": MAX_PARTICIPANTS
        })

manager = Manager()

# -----------------------------
# WEBSOCKET
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    
    user_name = f"Jugador{random.randint(100, 999)}"
    level = 1
    user_data = {"name": user_name, "level": level}
    ranking.append(user_data)

    # Primer reto
    current_game = generate_fallback_challenge()
    await ws.send_text(json.dumps({"type":"question","text":current_game["question"],"answer":current_game["answer"]}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "answer":
                ans = msg.get("text","").strip().lower()
                correct = current_game.get("answer","")
                is_correct = (ans == correct.lower()) if correct else True

                if is_correct:
                    level += 1
                    user_data["level"] = level
                    feedback = "💥 Correcto! Sigamos avanzando hacia el éxito!"
                else:
                    feedback = f"❌ Respuesta no correcta. Era: {correct}" if correct else "✅ Perfecto, reflexiona sobre la historia!"

                await ws.send_text(json.dumps({"type":"feedback","text":feedback}))

                # Actualizar ranking
                await manager.broadcast({
                    "type":"update_ranking",
                    "ranking": sorted(ranking, key=lambda x:x["level"], reverse=True)[:5]
                })

                # Generar nuevo reto
                try:
                    current_game = generate_fallback_challenge()
                except:
                    current_game = {"question":"🎯 Reto local: 2+2", "answer":"4"}

                await ws.send_text(json.dumps({"type":"question","text":current_game["question"],"answer":current_game["answer"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()
