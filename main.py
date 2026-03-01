from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json

app = FastAPI(title="KaMiZen NeuroGame Engine")

app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
ranking = []
used_questions = set()

# -----------------------------
# GENERADOR INFINITO DE RETOS
# -----------------------------
def generate_game():

    game_types = ["emocional", "doble", "serie", "adivinanza", "resta", "financiero"]

    game = random.choice(game_types)

    if game == "emocional":
        a = random.randint(1,5)
        b = random.randint(3,7)
        return {
            "question": f"Si hoy me siento {a} puntos feliz y mañana {b} puntos más… ¿cuánto tendré?",
            "answer": str(a+b)
        }

    if game == "doble":
        n = random.randint(5,40)
        return {
            "question": f"¿Cuánto es el doble de {n}?",
            "answer": str(n*2)
        }

    if game == "serie":
        start = random.randint(1,5)
        return {
            "question": f"{start}, {start*2}, {start*3}, ___",
            "answer": str(start*4)
        }

    if game == "adivinanza":
        return {
            "question": "Soy un número mayor que 10 y menor que 20. Soy par. Si me divides entre 2 te da 7. ¿Quién soy?",
            "answer": "14"
        }

    if game == "resta":
        total = random.randint(20,100)
        minus = random.randint(5,15)
        return {
            "question": f"Si tengo {total} y pierdo {minus}, ¿cuánto queda?",
            "answer": str(total-minus)
        }

    if game == "financiero":
        return {
            "question": "Vuelo sin alas, cruzo fronteras sin pasaporte y guardo tesoros sin ser cofre. ¿Qué soy?",
            "answer": "conocimiento de embarque"
        }


# -----------------------------
# CONNECTION MANAGER
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
            await c.send_text(json.dumps(data))

    async def broadcast_participants(self):
        await self.broadcast({
            "type":"update_participants",
            "count": len(self.connections),
            "max": MAX_PARTICIPANTS
        })

manager = Manager()

# -----------------------------
# WEBSOCKET
# -----------------------------
@app.websocket("/ws")
async def websocket(ws: WebSocket):

    await manager.connect(ws)

    user_name = f"Trader{random.randint(100,999)}"
    level = 1
    ranking.append({"name":user_name,"level":level})

    current_game = generate_game()

    await ws.send_text(json.dumps({
        "type":"question",
        "text": current_game["question"]
    }))

    try:
        while True:

            data = await ws.receive_text()
            data = json.loads(data)

            if data["type"] == "answer":
                user_answer = data["text"].strip().lower()

                if user_answer == current_game["answer"]:
                    level += 1
                    feedback = "💥 Correcto! Dopamina activada!"
                else:
                    feedback = f"Respuesta correcta: {current_game['answer']}"

                for r in ranking:
                    if r["name"] == user_name:
                        r["level"] = level

                await ws.send_text(json.dumps({
                    "type":"feedback",
                    "text":feedback
                }))

                await manager.broadcast({
                    "type":"update_ranking",
                    "ranking": sorted(ranking,key=lambda x:-x["level"])[:5]
                })

                # NUEVA PREGUNTA AUTOMÁTICA
                current_game = generate_game()

                await ws.send_text(json.dumps({
                    "type":"question",
                    "text":current_game["question"]
                }))

            if data["type"] == "chat":
                await manager.broadcast({
                    "type":"chat",
                    "sender":user_name,
                    "text":data["text"]
                })

    except WebSocketDisconnect:
        manager.disconnect(ws)
        ranking[:] = [r for r in ranking if r["name"]!=user_name]
        await manager.broadcast_participants()


# -----------------------------
# CHAT SIMULADO CONSTANTE
# -----------------------------
async def simulated_chat():
    messages = [
        "🔥 Cerré un trato importante hoy",
        "💰 Cada decisión suma nivel",
        "⚡ No pierdas segundos",
        "🏆 Subiendo disciplina financiera"
    ]
    while True:
        if manager.connections:
            await manager.broadcast({
                "type":"chat",
                "sender":"BOT",
                "text": random.choice(messages)
            })
        await asyncio.sleep(random.randint(6,10))

@app.on_event("startup")
async def start():
    asyncio.create_task(simulated_chat())


@app.get("/")
async def root():
    with open("static/session.html","r",encoding="utf-8") as f:
        return HTMLResponse(f.read())
