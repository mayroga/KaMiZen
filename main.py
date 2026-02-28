from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import asyncio
import random
from typing import List

app = FastAPI(title="KaMiZen")

# Montar carpeta static
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------
# Motor en memoria
# ---------------------------
MAX_USERS = 500
clients: List[WebSocket] = []
users_data = {}  # {websocket: {"name":..., "level":..., "answers":...}}

QUESTIONS = [
    "💥 ¿Qué hiciste hoy que te pone por delante de otros?",
    "🔥 Escribe una acción que te haga destacar en tu mercado.",
    "💰 Menciona algo que generará dinero hoy.",
    "⚡ ¿Qué decisión tomaste que nadie más tomó?",
    "🌟 Comparte un logro de valor personal.",
    "🚀 ¿Cuál es tu micro acción para aumentar tu poder hoy?",
    "🎯 Visualiza algo que lograrás en las próximas 24h."
]

SIMULATED_CHAT = [
    "💰 Cerré un trato millonario hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir de nivel",
    "💥 Me adelanté a todos en mi estrategia",
    "🌟 Acción concreta = ventaja competitiva",
    "🚀 Hoy subí de nivel mental"
]

RANKING = [
    {"name": "Anónimo1", "level": 5},
    {"name": "Anónimo2", "level": 4},
    {"name": "Anónimo3", "level": 3},
    {"name": "Anónimo4", "level": 2},
    {"name": "Anónimo5", "level": 1}
]

# ---------------------------
# Funciones auxiliares
# ---------------------------
async def broadcast(message: dict):
    to_remove = []
    for client in clients:
        try:
            await client.send_json(message)
        except:
            to_remove.append(client)
    for client in to_remove:
        clients.remove(client)
        if client in users_data:
            del users_data[client]

def get_ranking():
    real_users = [{"name": users_data[c]["name"], "level": users_data[c]["level"]} for c in clients if c in users_data]
    combined = RANKING.copy()
    for u in real_users:
        combined.append(u)
    combined.sort(key=lambda x: x["level"], reverse=True)
    return combined[:5]

# ---------------------------
# WebSocket endpoint
# ---------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    users_data[ws] = {"name": f"Usuario{len(clients)}", "level": 1, "answers": []}

    try:
        await broadcast({"type": "update_participants", "count": len(clients), "max": MAX_USERS})
        await broadcast({"type": "update_ranking", "ranking": get_ranking()})

        current_question = random.choice(QUESTIONS)
        await ws.send_json({"type": "question", "text": current_question})

        while True:
            data = await ws.receive_json()
            if data["type"] == "answer":
                answer = data["text"].strip()
                if answer:
                    users_data[ws]["answers"].append(answer)
                    users_data[ws]["level"] = min(users_data[ws]["level"] + 1, 10)
                    await ws.send_json({"type": "feedback", "text": "💥 Excelente, nivel +1!"})
                else:
                    await ws.send_json({"type": "feedback", "text": "⏳ No escribiste nada, intenta ser concreto."})
                remaining_questions = [q for q in QUESTIONS if q != current_question]
                if remaining_questions:
                    current_question = random.choice(remaining_questions)
                    await ws.send_json({"type": "question", "text": current_question})
                await broadcast({"type": "update_ranking", "ranking": get_ranking()})

            elif data["type"] == "chat":
                chat_text = data["text"]
                await broadcast({"type": "chat", "text": chat_text, "sender": users_data[ws]["name"], "simulated": False})

    except WebSocketDisconnect:
        clients.remove(ws)
        if ws in users_data:
            del users_data[ws]
        await broadcast({"type": "update_participants", "count": len(clients), "max": MAX_USERS})
        await broadcast({"type": "update_ranking", "ranking": get_ranking()})

# ---------------------------
# Chat simulado constante
# ---------------------------
async def simulated_chat_loop():
    while True:
        if clients:
            msg = random.choice(SIMULATED_CHAT)
            await broadcast({"type": "chat", "text": msg, "sender": "Simulado", "simulated": True})
        await asyncio.sleep(random.randint(5, 10))

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulated_chat_loop())
