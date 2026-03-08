import os
import json
import asyncio
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import httpx

app = FastAPI(title="KaMiZen NeuroGame Engine")

# Montar carpeta estática
app.mount("/static", StaticFiles(directory="static"), name="static")

# Variables globales
MAX_PARTICIPANTS = 500
sessions_history = set()  # Para evitar repetir historias
ranking = []

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# -----------------------------
# Rutas básicas
# -----------------------------
@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# -----------------------------
# Generar contenido con IA
# -----------------------------
async def generate_content(prompt: str) -> dict:
    """
    Pide a la IA (OpenAI o Gemini) una historia, acertijo o juego mental.
    """
    headers = {}
    payload = {}
    # Primero intentamos OpenAI
    if OPENAI_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
            payload = {
                "model": "gpt-4",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8
            }
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post("https://api.openai.com/v1/chat/completions",
                                      headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                text = data["choices"][0]["message"]["content"]
                return {"text": text}
        except Exception as e:
            print("OpenAI falló:", e)
    # Si falla OpenAI, intentamos Gemini
    if GEMINI_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {GEMINI_API_KEY}"}
            payload = {"prompt": prompt, "max_tokens": 500}
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post("https://api.generative.ai/v1/predict", headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                text = data["result"]["output_text"]
                return {"text": text}
        except Exception as e:
            print("Gemini falló:", e)
    # Fallback local si no hay IA
    return {"text": f"🎯 Reto local: Resuelve este acertijo: {random.randint(1,10)} + {random.randint(1,10)} = ?"}

# -----------------------------
# WebSocket manager
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
# WebSocket endpoint
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    user_name = f"Jugador{random.randint(100,999)}"
    level = 1
    user_data = {"name": user_name, "level": level}
    ranking.append(user_data)

    async def send_new_challenge():
        prompt = (
            "Eres ayudante de KaMiZen, genera un mini-desafío de 10 minutos "
            "con: acertijo o juego mental, historia de éxito/poder/bienestar, "
            "enseñanza, breve y positivo. Devuelve JSON: {'question': '', 'answer': ''}. "
            "No repitas ninguna historia ya enviada en esta sesión."
        )
        content = await generate_content(prompt)
        text = content["text"]
        # Fallback: si text vacío, usar local
        if not text.strip():
            text = f"🎯 Reto local: ¿Cuánto es {random.randint(1,20)} + {random.randint(1,20)}?"
        return {"question": text, "answer": ""}

    current_game = await send_new_challenge()
    await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg["type"] == "answer":
                ans = msg["text"].strip().lower()
                correct = current_game["answer"].lower() if current_game["answer"] else None

                if not correct or ans == correct:
                    level += 1
                    user_data["level"] = level
                    feedback = "💥 Correcto! Sigue avanzando."
                else:
                    feedback = f"❌ Incorrecto. Era: {correct}" if correct else "💡 Sigue intentando"

                await ws.send_text(json.dumps({"type": "feedback", "text": feedback}))

                # Actualizar ranking
                await manager.broadcast({
                    "type": "update_ranking",
                    "ranking": sorted(ranking, key=lambda x: x["level"], reverse=True)[:5]
                })

                # Generar nuevo desafío
                current_game = await send_new_challenge()
                await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()

# -----------------------------
# Chat de bots simulado
# -----------------------------
async def simulated_chat():
    msgs = [
        "🔥 Cada decisión cuenta",
        "💡 Paso a paso hacia el éxito",
        "🏆 Nivel aumentado",
        "🌱 Bienestar activo"
    ]
    while True:
        await asyncio.sleep(random.randint(8, 15))
        if manager.connections:
            await manager.broadcast({"type": "chat", "sender": "AURA_BOT", "text": random.choice(msgs)})

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulated_chat())
