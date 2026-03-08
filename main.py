from fastapi import FastAPI,WebSocket,WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import random
import json

app=FastAPI()

app.mount("/static",StaticFiles(directory="static"),name="static")

MAX_PARTICIPANTS=500
ranking=[]


@app.get("/")
async def root():
    with open("static/session.html","r",encoding="utf-8") as f:
        return HTMLResponse(f.read())


def generate_challenge():

    games=[

        lambda:{"question":"¿Cuánto es 5 + 7?","answer":"12"},

        lambda:{"question":"¿Doble de 8?","answer":"16"},

        lambda:{"question":"3,6,9,___","answer":"12"},

        lambda:{"question":"Número par entre 10 y 20 que dividido en 2 da 7","answer":"14"},

        lambda:{"question":"Si tengo 20 y pierdo 4 ¿cuánto queda?","answer":"16"}

    ]

    return random.choice(games)()


class Manager:

    def __init__(self):
        self.connections=[]

    async def connect(self,ws:WebSocket):
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

                ans=msg["text"].strip()

                if ans==current_game["answer"]:

                    level+=1
                    user_data["level"]=level

                    feedback="💥 Correcto! Nivel aumentado"

                else:

                    feedback=f"❌ Incorrecto. Era {current_game['answer']}"

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


async def simulated_chat():

    msgs=[
        "🔥 Cada decisión cuenta",
        "💡 Pequeños pasos grandes logros",
        "🏆 Subiendo nivel",
        "🌱 Mente clara"
    ]

    while True:

        await asyncio.sleep(random.randint(8,15))

        if manager.connections:

            await manager.broadcast({
                "type":"chat",
                "sender":"AURA_BOT",
                "text":random.choice(msgs)
            })


@app.on_event("startup")
async def startup_event():

    asyncio.create_task(simulated_chat())
