from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_PARTICIPANTS = 500
ranking = []

SESSION_TIME = 600


@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


# -----------------------------
# ENGINE DE DESAFÍOS
# -----------------------------

def math_game():
    a = random.randint(2,20)
    b = random.randint(2,20)
    return {"question": f"¿Cuánto es {a} + {b}?", "answer": str(a+b)}

def logic_game():
    return {
        "question":"Soy un número par entre 10 y 20 y dividido entre 2 da 7 ¿Quién soy?",
        "answer":"14"
    }

def sequence_game():
    n=random.randint(2,5)
    return {
        "question":f"{n}, {n*2}, {n*3}, ___",
        "answer":str(n*4)
    }

def riddle_game():

    riddles=[
        ("Cuanto más quitas más grande se vuelve ¿Qué es?","agujero"),
        ("Tengo ciudades pero no casas, ríos pero no agua ¿Qué soy?","mapa"),
        ("Vuelo sin alas y lloro sin ojos ¿Qué soy?","nube")
    ]

    r=random.choice(riddles)

    return {"question":f"Adivinanza: {r[0]}", "answer":r[1]}


def success_story():

    stories=[
        "Historia real: Sara empezó vendiendo café desde su casa y hoy dirige una cadena de cafeterías.",
        "Historia real: Carlos perdió su negocio, aprendió programación y hoy lidera una startup tecnológica.",
        "Historia real: Marta ahorró pequeñas cantidades durante años y logró abrir su propio restaurante."
    ]

    return {"question":random.choice(stories),"answer":""}


def wellbeing_game():

    tips=[
        "Bienestar: Respira profundo durante 10 segundos. Escribe 'hecho' cuando termines.",
        "Bienestar: Piensa en algo por lo que estés agradecido hoy. Escribe 'listo'.",
        "Bienestar: Endereza tu espalda y respira lento 5 veces. Escribe 'ok'."
    ]

    return {"question":random.choice(tips),"answer":""}


def power_game():

    power=[
        ("Tienes dos caminos: seguro o arriesgado. ¿Cuál eliges?","seguro"),
        ("Debes liderar un equipo: firmeza o empatía ¿Qué eliges?","empatía")
    ]

    p=random.choice(power)

    return {"question":p[0],"answer":p[1]}


game_types=[
math_game,
logic_game,
sequence_game,
riddle_game,
success_story,
wellbeing_game,
power_game
]


def generate_challenge():
    return random.choice(game_types)()


# -----------------------------
# CONEXIONES
# -----------------------------

class Manager:

    def __init__(self):
        self.connections=[]

    async def connect(self,ws):
        await ws.accept()
        self.connections.append(ws)
        await self.broadcast_participants()

    def disconnect(self,ws):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self,data):
        for c in self.connections:
            try:
                await c.send_text(json.dumps(data))
            except:
                pass

    async def broadcast_participants(self):

        await self.broadcast({
            "type":"update_participants",
            "count":len(self.connections)
        })


manager=Manager()


# -----------------------------
# TIMER GLOBAL
# -----------------------------

async def game_timer():

    time_left=SESSION_TIME

    while True:

        await asyncio.sleep(1)

        time_left-=1

        if time_left<=0:
            time_left=SESSION_TIME

        minutes=time_left//60
        seconds=time_left%60

        time_str=f"{minutes}:{seconds:02}"

        await manager.broadcast({
            "type":"timer",
            "time":time_str
        })


# -----------------------------
# CHAT BOT
# -----------------------------

async def simulated_chat():

    msgs=[
        "🔥 Cada decisión cuenta",
        "💡 Pequeños pasos crean grandes logros",
        "🏆 Subiendo de nivel",
        "🌱 Mente clara, decisión clara"
    ]

    while True:

        await asyncio.sleep(random.randint(8,15))

        if manager.connections:

            await manager.broadcast({
                "type":"chat",
                "sender":"AURA_BOT",
                "text":random.choice(msgs)
            })


# -----------------------------
# WEBSOCKET
# -----------------------------

@app.websocket("/ws")
async def websocket_endpoint(ws:WebSocket):

    await manager.connect(ws)

    user_name=f"Jugador{random.randint(100,999)}"
    level=1

    user_data={"name":user_name,"level":level}

    ranking.append(user_data)

    current_game=generate_challenge()

    await ws.send_text(json.dumps({
        "type":"question",
        "text":current_game["question"]
    }))

    try:

        while True:

            data=await ws.receive_text()
            msg=json.loads(data)

            if msg["type"]=="answer":

                ans=msg["text"].lower().strip()

                correct=current_game["answer"]

                if correct=="" or ans==correct.lower():

                    level+=1
                    user_data["level"]=level

                    feedback="💥 Correcto! Nivel aumentado"

                else:

                    feedback=f"❌ Incorrecto. Era {correct}"

                await ws.send_text(json.dumps({
                    "type":"feedback",
                    "text":feedback
                }))

                await manager.broadcast({
                    "type":"update_ranking",
                    "ranking":sorted(ranking,key=lambda x:x["level"],reverse=True)[:5]
                })

                current_game=generate_challenge()

                await ws.send_text(json.dumps({
                    "type":"question",
                    "text":current_game["question"]
                }))


            if msg["type"]=="skip":

                current_game=generate_challenge()

                await ws.send_text(json.dumps({
                    "type":"question",
                    "text":current_game["question"]
                }))

    except WebSocketDisconnect:

        manager.disconnect(ws)

        if user_data in ranking:
            ranking.remove(user_data)

        await manager.broadcast_participants()


@app.on_event("startup")
async def startup_event():

    asyncio.create_task(simulated_chat())
    asyncio.create_task(game_timer())
