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

# -----------------------------
# GENERADOR DE RETOS
# -----------------------------
def generate_challenge():
    """
    Genera un minijuego mental: matemáticas, lógica, decisiones, obstáculos, mini-historias.
    Devuelve pregunta y respuesta.
    """
    challenge_types = ["matematica", "logica", "historia", "decision", "bienestar", "poder"]
    typ = random.choice(challenge_types)
    
    # Matemáticas simples
    if typ == "matematica":
        a = random.randint(1, 20)
        b = random.randint(1, 20)
        return {"question": f"Si sumas {a} + {b}, ¿cuál es el resultado?", "answer": str(a+b)}
    
    # Lógica / adivinanza
    if typ == "logica":
        r = random.randint(10, 50)
        return {"question": f"Soy un número divisible por 5 entre 10 y 50. Si me divides entre 5 obtienes 6. ¿Quién soy?", "answer": "30"}
    
    # Mini historia de éxito o poder
    if typ == "historia":
        stories = [
            "💎 Historia de Éxito: Carlos enfrentó un desafío en su empresa y logró duplicar su productividad.",
            "🚀 Camino al Poder: Marta tomó una decisión audaz y ahora lidera un equipo de alto impacto.",
            "🌱 Bienestar: Juan decidió meditar 10 minutos cada mañana y su energía y claridad mental aumentaron."
        ]
        story = random.choice(stories)
        return {"question": story, "answer": ""}
    
    # Decisión y obstáculo
    if typ == "decision":
        decisions = [
            {
                "scenario": "Estás frente a un proyecto difícil. ¿Decides asumirlo o delegarlo?",
                "options": {"asumir": "Valor y crecimiento", "delegar": "Aprender a confiar"}
            },
            {
                "scenario": "Tienes una oportunidad de inversión incierta. ¿Arriesgas o conservas?",
                "options": {"arriesgar": "Posible gran éxito", "conservar": "Seguridad y aprendizaje"}
            }
        ]
        d = random.choice(decisions)
        return {"question": d["scenario"] + " Escribe tu elección (arriesgar/asumir/delegar/conservar):", 
                "answer": list(d["options"].keys())}
    
    # Bienestar y consejo de vida
    if typ == "bienestar":
        advice = [
            "Respira profundo y enfrenta tu miedo, eso activa tu poder interno.",
            "Organiza tu día: pequeñas victorias diarias conducen a grandes éxitos.",
            "Ayuda a alguien hoy: mejorarás tu bienestar y el de otros."
        ]
        return {"question": random.choice(advice), "answer": ""}
    
    # Poder y estrategia
    if typ == "poder":
        challenges = [
            "💡 Estrategia: Tienes dos caminos, uno seguro y otro arriesgado pero con alto potencial. ¿Cuál eliges? (seguro/arriesgado)",
            "🏆 Liderazgo: Debes motivar a tu equipo en un momento crítico. ¿Actúas con firmeza o empatía? (firmeza/empatia)"
        ]
        c = random.choice(challenges)
        return {"question": c, "answer": ["seguro","arriesgado","firmeza","empatia"]}

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
    
    user_name = f"Jugador{random.randint(100, 999)}"
    level = 1
    user_data = {"name": user_name, "level": level}
    ranking.append(user_data)

    current_game = generate_challenge()
    await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg["type"] == "answer":
                ans = msg["text"].strip().lower()
                correct = current_game["answer"]
                if isinstance(correct, list):
                    is_correct = ans in [x.lower() for x in correct]
                else:
                    is_correct = (ans == correct.lower())
                
                if is_correct or correct == "":
                    level += 1
                    user_data["level"] = level
                    feedback = "💥 Correcto! Sigamos avanzando hacia el éxito!"
                else:
                    feedback = f"❌ Respuesta no correcta. Sigue intentándolo! " + (f"Era: {correct}" if correct else "")
                
                await ws.send_text(json.dumps({"type": "feedback", "text": feedback}))

                await manager.broadcast({
                    "type": "update_ranking",
                    "ranking": sorted(ranking, key=lambda x: x["level"], reverse=True)[:5]
                })

                current_game = generate_challenge()
                await ws.send_text(json.dumps({"type": "question", "text": current_game["question"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()

# -----------------------------
# BOT SIMULADO
# -----------------------------
async def simulated_chat():
    msgs = [
        "🔥 Cada decisión cuenta",
        "💡 Recuerda: pequeños pasos crean grandes logros",
        "🏆 Subiendo de nivel en el camino al éxito",
        "🌱 Bienestar activo, mente clara"
    ]
    while True:
        await asyncio.sleep(random.randint(8, 15))
        if manager.connections:
            await manager.broadcast({"type": "chat", "sender": "AURA_BOT", "text": random.choice(msgs)})

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulated_chat())
