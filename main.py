from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json

app = FastAPI(title="KaMiZen WebSocket Backend")

# ------------------------------
# Montar carpeta static
# ------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

# ------------------------------
# Variables globales en memoria
# ------------------------------
MAX_PARTICIPANTS = 500
clients = []
ranking = []
chat_simulated = [
    "💰 Cerré un trato millonario hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir de nivel",
    "🏆 Subí un nivel gracias a mi disciplina",
    "💥 Cada palabra cuenta, actúa ya"
]
questions_bank = [
    "¿Qué hiciste hoy que realmente te pone por delante?",
    "Describe un logro que otros no alcanzaron hoy",
    "¿Qué decisión rápida tomaste que te generó ventaja?",
    "Cita algo que aprendiste y aplicaste hoy",
    "¿Qué acción concreta de hoy aumentó tu productividad?"
]

# ------------------------------
# Cliente WebSocket Manager
# ------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await self.broadcast_participants()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        data = json.dumps(message)
        for connection in self.active_connections:
            await connection.send_text(data)

    async def broadcast_participants(self):
        msg = {"type": "update_participants", "count": len(self.active_connections), "max": MAX_PARTICIPANTS}
        await self.broadcast(msg)

manager = ConnectionManager()

# ------------------------------
# WebSocket endpoint
# ------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    user_name = f"Anónimo{random.randint(1, 9999)}"
    user_level = 1
    ranking.append({"name": user_name, "level": user_level})

    try:
        # Enviar ranking inicial
        await manager.broadcast({"type": "update_ranking", "ranking": sorted(ranking, key=lambda x: -x["level"])[:5]})
        # Enviar primera pregunta
        question = random.choice(questions_bank)
        await websocket.send_text(json.dumps({"type": "question", "text": question}))

        while True:
            data = await websocket.receive_text()
            data_json = json.loads(data)

            # -----------------------
            # Respuesta del usuario
            # -----------------------
            if data_json["type"] == "answer":
                text = data_json.get("text", "")
                # Feedback sencillo y subida de nivel
                if len(text.strip()) == 0:
                    feedback = "No escribiste nada. Ejemplo: 'Hoy cerré un trato rápido y gané ventaja.'"
                else:
                    feedback = "💥 Excelente! Subes un nivel."
                    user_level = min(user_level + 1, 10)
                # Actualizar ranking
                for u in ranking:
                    if u["name"] == user_name:
                        u["level"] = user_level
                await websocket.send_text(json.dumps({"type": "feedback", "text": feedback}))
                await manager.broadcast({"type": "update_ranking", "ranking": sorted(ranking, key=lambda x: -x["level"])[:5]})

            # -----------------------
            # Chat en vivo
            # -----------------------
            elif data_json["type"] == "chat":
                text = data_json.get("text", "")
                msg = {"type": "chat", "sender": user_name, "text": text, "simulated": False}
                await manager.broadcast(msg)

            # -----------------------
            # Simular chat constante
            # -----------------------
            # Esto se hace en paralelo abajo

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        ranking[:] = [u for u in ranking if u["name"] != user_name]
        await manager.broadcast_participants()
        await manager.broadcast({"type": "update_ranking", "ranking": sorted(ranking, key=lambda x: -x["level"])[:5]})

# ------------------------------
# Chat simulado automático
# ------------------------------
async def chat_simulator():
    while True:
        if manager.active_connections:
            msg = {"type": "chat", "sender": "Simulado", "text": random.choice(chat_simulated), "simulated": True}
            await manager.broadcast(msg)
        await asyncio.sleep(random.randint(5,10))

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(chat_simulator())

# ------------------------------
# Página de prueba raíz
# ------------------------------
@app.get("/")
async def get_root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)
