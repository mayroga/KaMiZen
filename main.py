from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import json, random, asyncio

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
ranking = []

# RUTAS
@app.get("/")
async def root():
    with open("static/session.html","r",encoding="utf-8") as f:
        return HTMLResponse(f.read())

# GENERADOR DE RETOS
def generate_challenge():
    # Juegos matemáticos
    a = random.randint(1,20)
    b = random.randint(1,20)
    math_game = {"question": f"Si sumas {a}+{b}, ¿cuál es el resultado?", "answer": str(a+b)}

    # Adivinanza
    riddles = [
        {"question":"Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.","answer":"pera"},
        {"question":"Cuanto más quitas, más grande se vuelve. ¿Qué es?","answer":"agujero"},
        {"question":"Tengo agujas pero no pincho. Marco el tiempo. ¿Qué soy?","answer":"reloj"}
    ]
    riddle_game = random.choice(riddles)

    # Mini historias de éxito/poder/bienestar
    stories = [
        {"story":"La semilla en el concreto. Enseñanza: El bienestar no llega por suerte, llega cuando transformas lo que otros ignoran en oportunidad de valor.","answer":""},
        {"story":"El puente invisible. Enseñanza: Tu mejor inversión es especializarte y generar confianza en momentos de incertidumbre.","answer":""},
        {"story":"La regla de los segundos. Enseñanza: El éxito no es no caer, es levantarse rápido con un plan.","answer":""}
    ]
    story_game = random.choice(stories)

    # Escoger tipo de reto aleatorio
    choice = random.choice([math_game,riddle_game,story_game])
    return choice

# MANAGER DE CONEXIONES
class Manager:
    def __init__(self):
        self.connections = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        await self.broadcast_participants()

    def disconnect(self, ws: WebSocket):
        if ws in self.connections: self.connections.remove(ws)

    async def broadcast(self, data):
        for c in self.connections:
            try:
                await c.send_text(json.dumps(data))
            except: pass

    async def broadcast_participants(self):
        await self.broadcast({"type":"update_participants","count":len(self.connections)})

manager = Manager()

# WEBSOCKET
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    user_name = f"Jugador{random.randint(100,999)}"
    level = 1
    user_data = {"name":user_name,"level":level}
    ranking.append(user_data)

    current_game = generate_challenge()
    await ws.send_text(json.dumps({"type":"question","question":current_game.get("question"),"story":current_game.get("story"),"answer":current_game.get("answer")}))

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg["type"]=="answer":
                ans = msg["text"].strip().lower()
                correct = current_game.get("answer","")
                if correct=="" or (isinstance(correct,list) and ans in correct) or ans==correct.lower():
                    level+=1
                    user_data["level"]=level
                    feedback = "💥 Correcto! Sigamos avanzando!"
                else:
                    feedback = f"❌ Incorrecto. Era: {correct}"
                await ws.send_text(json.dumps({"type":"feedback","text":feedback}))
                await manager.broadcast({"type":"update_ranking","ranking":sorted(ranking,key=lambda x:x["level"],reverse=True)[:5]})
                current_game = generate_challenge()
                await ws.send_text(json.dumps({"type":"question","question":current_game.get("question"),"story":current_game.get("story"),"answer":current_game.get("answer")}))
    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking: ranking.remove(user_data)
        await manager.broadcast_participants()
