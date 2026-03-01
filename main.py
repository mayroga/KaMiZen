from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json

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

@app.get("/session")
async def get_session():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# -----------------------------
# GENERADOR DE RETOS
# -----------------------------
def generate_game():
    game_types = ["emocional", "doble", "serie", "adivinanza", "resta", "financiero", "historia"]
    game = random.choice(game_types)

    if game == "emocional":
        a, b = random.randint(1, 5), random.randint(3, 7)
        return {"question": f"Si hoy me siento {a} puntos feliz y mañana {b} más… ¿cuánto tendré?", "answer": str(a+b)}
    
    if game == "doble":
        n = random.randint(5, 40)
        return {"question": f"¿Cuánto es el doble de {n}?", "answer": str(n*2)}
    
    if game == "serie":
        s = random.randint(1, 5)
        return {"question": f"{s}, {s*2}, {s*3}, ___", "answer": str(s*4)}
    
    if game == "adivinanza":
        return {"question": "Número par >10 y <20. Si me divides entre 2 da 7. ¿Quién soy?", "answer": "14"}
    
    if game == "resta":
        t, m = random.randint(20, 100), random.randint(5, 15)
        return {"question": f"Si tengo {t} y pierdo {m}, ¿cuánto queda?", "answer": str(t-m)}
    
    if game == "financiero":
        return {"question": "Vuelo sin alas, cruzo fronteras sin pasaporte y guardo tesoros sin ser cofre. ¿Qué soy?", "answer": "conocimiento de embarque"}
    
    if game == "historia":
        stories = [
            "💎 Historia de éxito: Ana invirtió en sí misma y duplicó su productividad.",
            "🚀 Poder: Cada decisión cuenta, ¡hoy subes un nivel!",
            "🌱 Bienestar: Respirar profundo y resolver un desafío activa tu dopamina."
        ]
        story = random.choice(stories)
        return {"question": story, "answer": ""}

# -----------------------------
# GESTIÓN DE CONEXIONES
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
# WEBSOCKET PRINCIPAL
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    
    user_name = f"Trader{random.randint(100, 999)}"
    level = 1
    user_data = {"name": user_name, "level": level}
    ranking.append(user_data)

    current_game = generate_game()
    await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg["type"] == "answer":
                ans = msg["text"].strip().lower()
                if ans == current_game["answer"].lower():
                    level += 1
                    user_data["level"] = level
                    feedback = "💥 Correcto! Dopamina activada!"
                else:
                    feedback = f"❌ Error. Era: {current_game['answer']}" if current_game['answer'] else "💡 Continúa al siguiente reto!"
                
                await ws.send_text(json.dumps({"type": "feedback", "text": feedback}))
                
                # Actualizar Ranking Global
                await manager.broadcast({
                    "type": "update_ranking",
                    "ranking": sorted(ranking, key=lambda x: x["level"], reverse=True)[:5]
                })

                # Siguiente reto
                current_game = generate_game()
                await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()

# -----------------------------
# BOT DE CHAT SIMULADO
# -----------------------------
async def simulated_chat():
    msgs = [
        "🔥 Trato cerrado con éxito",
        "💰 Cada decisión suma",
        "⚡ ¡Rápido, no pierdas tiempo!",
        "🏆 Subiendo nivel",
        "💡 Descubrí un patrón financiero",
        "🌱 Respira, aprende y gana"
    ]
    while True:
        await asyncio.sleep(random.randint(8, 15))
        if manager.connections:
            await manager.broadcast({"type": "chat", "sender": "AURA_BOT", "text": random.choice(msgs)})

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulated_chat())
