from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio, random, json

app = FastAPI(title="KaMiZen NeuroGame Advanced")
app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
SESSION_TIME = 600  # 10 minutos
ranking = []

# -----------------------------
# RETOS AVANZADOS (200 juegos)
# -----------------------------
# Guardar preguntas para no repetir
asked_questions = set()

def generate_math(level=1):
    a = random.randint(2*level,20*level)
    b = random.randint(2*level,20*level)
    return {"question": f"[Math L{level}] ¿Cuánto es {a} + {b}?", "answer": str(a+b)}

def generate_logic(level=1):
    x = random.randint(1*level,10*level)
    y = x*2
    return {"question": f"[Logic L{level}] Secuencia: {x}, {y}, {y*2}, ___", "answer": str(y*2*2)}

def generate_riddle(level=1):
    riddles = [
        ("Adivina: Cuanto más quitas, más grande se vuelve", "agujero"),
        ("Adivina: Tengo ciudades pero no casas, ríos pero no agua", "mapa"),
        ("Adivina: Vuelo sin alas y lloro sin ojos", "nube"),
        ("Adivina: Me rompen si digo mi nombre", "silencio")
    ]
    riddle = random.choice(riddles)
    return {"question": f"[Riddle L{level}] {riddle[0]}", "answer": riddle[1]}

def generate_story(level=1):
    stories = [
        "Historia real: Sara empezó vendiendo café y ahora dirige su cadena de cafeterías.",
        "Historia real: Carlos aprendió programación y hoy lidera una startup.",
        "Historia real: Marta ahorró y abrió su restaurante."
    ]
    return {"question": f"[Story L{level}] {random.choice(stories)}", "answer": ""}

def generate_wellbeing(level=1):
    tips = [
        "Bienestar: Respira profundo y escribe 'hecho'.",
        "Bienestar: Piensa en algo por lo que estés agradecido hoy y escribe 'listo'.",
        "Bienestar: Endereza tu espalda y respira 5 veces. Escribe 'ok'."
    ]
    return {"question": f"[Wellbeing L{level}] {random.choice(tips)}", "answer": ""}

def generate_power(level=1):
    power = [
        ("Debes liderar equipo: firmeza o empatía", "empatía"),
        ("Decisión de riesgo: seguro o arriesgado", "seguro")
    ]
    p = random.choice(power)
    return {"question": f"[Power L{level}] {p[0]}", "answer": p[1]}

def generate_trading(level=1):
    # Decisión financiera
    invest = random.randint(100*level, 1000*level)
    risk = random.choice(["arriesgar","conservar"])
    question = f"[Trading L{level}] Tienes ${invest}. ¿Arriesgas o conservas?"
    answer = risk
    return {"question": question, "answer": answer}

def generate_challenge(level=1):
    games = [
        generate_math, generate_logic, generate_riddle,
        generate_story, generate_wellbeing, generate_power, generate_trading
    ]
    while True:
        game = random.choice(games)(level)
        if game["question"] not in asked_questions:
            asked_questions.add(game["question"])
            return game

# -----------------------------
# CONEXIONES Y MANAGER
# -----------------------------
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

# -----------------------------
# TIMER GLOBAL
# -----------------------------
async def game_timer():
    time_left = SESSION_TIME
    while True:
        await asyncio.sleep(1)
        time_left -= 1
        if time_left <= 0:
            time_left = SESSION_TIME
        minutes = time_left // 60
        seconds = time_left % 60
        time_str = f"{minutes}:{seconds:02}"
        await manager.broadcast({"type":"timer","time":time_str})

# -----------------------------
# CHAT SIMULADO
# -----------------------------
async def simulated_chat():
    msgs = [
        "🔥 Cada decisión cuenta",
        "💡 Pequeños pasos crean grandes logros",
        "🏆 Subiendo de nivel",
        "🌱 Mente clara, decisión clara"
    ]
    while True:
        await asyncio.sleep(random.randint(8,15))
        if manager.connections:
            await manager.broadcast({"type":"chat","sender":"AURA_BOT","text":random.choice(msgs)})

# -----------------------------
# WEBSOCKET
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    user_name = f"Jugador{random.randint(100,999)}"
    level = 1
    user_data = {"name":user_name,"level":level}
    ranking.append(user_data)
    current_game = generate_challenge(level)
    await ws.send_text(json.dumps({"type":"question","text":current_game["question"]}))
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)

            if msg["type"]=="answer":
                ans = msg["text"].lower().strip()
                correct = current_game["answer"]
                if correct == "" or ans == correct.lower():
                    level += 1
                    user_data["level"]=level
                    feedback = f"💥 Correcto! Nivel {level}"
                else:
                    feedback = f"❌ Incorrecto. Era: {correct}"
                await ws.send_text(json.dumps({"type":"feedback","text":feedback}))
                await manager.broadcast({"type":"update_ranking",
                                         "ranking":sorted(ranking,key=lambda x:x["level"],reverse=True)[:5]})
                # Nuevo juego con nivel según progreso
                new_level = min(3, (level-1)//5 +1)
                current_game = generate_challenge(new_level)
                await ws.send_text(json.dumps({"type":"question","text":current_game["question"]}))

            if msg["type"]=="skip":
                new_level = min(3, (level-1)//5 +1)
                current_game = generate_challenge(new_level)
                await ws.send_text(json.dumps({"type":"question","text":current_game["question"]}))

    except WebSocketDisconnect:
        manager.disconnect(ws)
        if user_data in ranking:
            ranking.remove(user_data)
        await manager.broadcast_participants()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulated_chat())
    asyncio.create_task(game_timer())
