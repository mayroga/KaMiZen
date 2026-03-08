from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import os
import random
import httpx

app = FastAPI(title="KaMiZen NeuroGame Engine")

app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
ranking = []

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

# -----------------------------
# IA: generar desafío único
# -----------------------------
async def generate_challenge_via_ai():
    prompt = """Eres ayudante de KaMiZen. Genera un mini-desafío único de 1 a 2 frases, que sea:
- Historia corta de éxito, poder, bienestar o dinero
- Adivinanza o reto matemático
Devuelve un JSON con:
{"question":"Texto del reto o historia","answer":"Respuesta o texto que se revelará al cliente"}"""

    # Fallback local
    local_challenges = [
        {"question":"Si sumas 7+5, ¿cuánto es?","answer":"12"},
        {"question":"Adivina: Tiene dientes pero no muerde, ¿qué es?","answer":"Peine"},
        {"question":"💡 Historia: Un emprendedor reinvirtió todo su primer ingreso y creció en 10 años.","answer":"Reinversión"},
        {"question":"⚡ Reto: Completa la serie 2,4,6,___","answer":"8"}
    ]

    # Intentar Gemini primero
    if GEMINI_KEY:
        try:
            headers = {"Authorization": f"Bearer {GEMINI_KEY}"}
            data = {"prompt": prompt, "temperature":0.8}
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post("https://gemini.api.url/generate", headers=headers, json=data)
                resp = r.json()
                challenge = json.loads(resp.get("text","{}"))
                if "question" in challenge and "answer" in challenge:
                    return challenge
        except Exception:
            pass

    # Fallback OpenAI
    if OPENAI_KEY:
        try:
            headers = {"Authorization": f"Bearer {OPENAI_KEY}"}
            data = {
                "model": "gpt-4",
                "messages": [{"role":"user","content":prompt}],
                "temperature":0.8
            }
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
                resp = r.json()
                text = resp['choices'][0]['message']['content'].strip()
                challenge = json.loads(text)
                if "question" in challenge and "answer" in challenge:
                    return challenge
        except Exception:
            pass

    # Local fallback seguro
    return random.choice(local_challenges)

# -----------------------------
# Gestor de conexiones
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
        await self.broadcast({"type":"update_participants","count":len(self.connections),"max":MAX_PARTICIPANTS})

manager = Manager()

# -----------------------------
# WebSocket principal
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    user_name = f"Jugador{random.randint(100,999)}"
    level = 1
    user_data = {"name":user_name,"level":level}
    ranking.append(user_data)

    current_game = await generate_challenge_via_ai()
    if "question" not in current_game or not current_game["question"]:
        current_game["question"] = "🎯 Cargando desafío..."
    if "answer" not in current_game:
        current_game["answer"] = ""

    await ws.send_text(json.dumps({"type":"question","text":current_game["question"],"answer":current_game["answer"]}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg["type"]=="answer":
                ans = msg.get("text","").strip().lower()
                correct = current_game.get("answer","")
                if isinstance(correct,list):
                    is_correct = ans in [x.lower() for x in correct]
                else:
                    is_correct = (ans==correct.lower()) or correct=="" 

                feedback = "💥 Correcto! Sigue disfrutando KaMiZen!" if is_correct else f"❌ Incorrecto. Era: {correct}" if correct else "❌ Incorrecto"
                await ws.send_text(json.dumps({"type":"feedback","text":feedback}))

                top5 = sorted(ranking, key=lambda x:x["level"], reverse=True)[:5]
                await manager.broadcast({"type":"update_ranking","ranking":top5})

                current_game = await generate_challenge_via_ai()
                if "question" not in current_game or not current_game["question"]:
                    current_game["question"] = "🎯 Cargando desafío..."
                if "answer" not in current_game:
                    current_game["answer"] = ""
                await ws.send_text(json.dumps({"type":"question","text":current_game["question"],"answer":current_game["answer"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()

# -----------------------------
# Ruta principal
# -----------------------------
@app.get("/")
async def root():
    with open("static/session.html","r",encoding="utf-8") as f:
        return HTMLResponse(f.read())
