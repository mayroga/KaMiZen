from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA_FILE = "session_data.json"

# ---------------------------
# BASE DE DATOS
# ---------------------------

db = {

"historias":[
"El éxito comienza con la disciplina diaria.",
"La reinversión es el motor de tu libertad financiera.",
"Un líder se define por su capacidad de mantener la calma bajo presión.",
"El poder reside en la toma de decisiones informada, no en la velocidad.",
"Tu visión es tu mapa; la constancia, tu combustible.",
"Cada pequeño hábito construye grandes resultados.",
"Aprender de tus errores acelera tu crecimiento.",
"La paciencia es la clave de la acumulación de riqueza.",
"No esperes la motivación, crea la disciplina.",
"El enfoque transforma la energía en resultados.",
"Tu tiempo es tu recurso más valioso; protégelo.",
"El éxito no es suerte, es persistencia estratégica.",
"La claridad mental precede a la acción efectiva.",
"Los desafíos son maestros disfrazados.",
"La constancia vence a la inspiración pasajera.",
"Tu actitud define la dirección de tu vida.",
"Cada decisión financiera refleja tus prioridades.",
"El liderazgo comienza con el autocontrol.",
"El conocimiento aplicado genera poder real.",
"Visualiza el resultado antes de actuar.",
"Los hábitos financieros construyen libertad.",
"Invertir en ti mismo siempre paga dividendos.",
"La disciplina silenciosa crea resultados visibles.",
"El autocuidado es una estrategia de éxito.",
"Tu entorno influye en tu productividad más de lo que imaginas.",
"El control de emociones es control de destino.",
"Sé constante cuando nadie te observa.",
"El dinero sigue a la estrategia, no al deseo.",
"Cada fracaso es un escalón hacia la maestría.",
"La decisión correcta es mejor que la acción rápida."
],

"ejercicios":[
"Calcula el 20% de 500.",
"Si tienes 3 pallets y cada uno pesa 200kg, ¿cuánto es el total?",
"Adivina: ¿Qué es lo que crece más cuanto más quitas de ello? (Respuesta: Un hoyo)",
"Reto: 15 x 4 + 10.",
"Si el tiempo es dinero, ¿cuánto valen 10 minutos de tu enfoque total?",
"Si compras 5 libros a $12 cada uno, ¿cuánto gastaste?",
"Reto: 7 x 8 - 10.",
"Si tienes 24 manzanas y repartes 4 por persona, ¿a cuántas personas alcanzan?",
"Calcula: 250 + 350 - 125.",
"Si ahorras $50 cada semana, ¿cuánto tendrás en 6 semanas?",
"Reto mental: 12 x 6.",
"Si un artículo cuesta $45 y hay un 10% de descuento, ¿cuál es el precio final?",
"Si corres 3 km diarios, ¿cuántos km habrás corrido en 10 días?",
"Reto: 8 x 7 + 15.",
"Si tienes $500 y gastas $180, ¿cuánto te queda?",
"Adivina: ¿Qué tiene llaves pero no puede abrir puertas? (Respuesta: Un piano)"
],

"bienestar":[
"Inhala durante 4 segundos, mantén 4, exhala 4. Repite.",
"Cierra los ojos y visualiza tu meta cumplida por 30 segundos.",
"Suelta la tensión de tus hombros; la claridad viene con el cuerpo relajado.",
"Tu bienestar es la base de tu productividad.",
"Respira, suelta lo que no puedes controlar hoy.",
"Dedica 5 minutos a estirarte y activar tu cuerpo.",
"Observa tu postura: ajusta espalda y cuello.",
"Cierra los ojos y agradece tres cosas que tienes hoy.",
"Toma un vaso de agua y siente la hidratación en tu cuerpo.",
"Respira profundamente antes de tomar decisiones importantes.",
"Visualiza un lugar tranquilo y siente la calma.",
"Recuerda que pausas cortas aumentan tu productividad."
]

}

# ---------------------------
# PERSISTENCIA
# ---------------------------

def cargar_historial():

    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE,"r") as f:
                return json.load(f)
        except:
            return {}

    return {}


def guardar_historial(historial):

    with open(DATA_FILE,"w") as f:
        json.dump(historial,f)


def obtener_siguiente_contenido(user_id,categoria):

    historial = cargar_historial()

    if user_id not in historial:
        historial[user_id] = {
            "historias":[],
            "ejercicios":[],
            "bienestar":[]
        }

    vistas = historial[user_id][categoria]

    disponibles = [
        item for item in db[categoria]
        if item not in vistas
    ]

    if not disponibles:

        historial[user_id][categoria] = []
        disponibles = db[categoria]

    seleccion = random.choice(disponibles)

    historial[user_id][categoria].append(seleccion)

    guardar_historial(historial)

    return seleccion


# ---------------------------
# GESTOR DE CONEXIONES
# ---------------------------

class Manager:

    def __init__(self):
        self.connections = {}

    async def connect(self,ws:WebSocket,uid:str):

        await ws.accept()
        self.connections[uid] = ws

    def disconnect(self,uid:str):

        if uid in self.connections:
            del self.connections[uid]


manager = Manager()


# ---------------------------
# WEBSOCKET
# ---------------------------

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(ws:WebSocket,user_id:str):

    await manager.connect(ws,user_id)

    contenido = {

        "historia": obtener_siguiente_contenido(user_id,"historias"),

        "ejercicio": obtener_siguiente_contenido(user_id,"ejercicios"),

        "bienestar": obtener_siguiente_contenido(user_id,"bienestar")

    }

    await ws.send_json({

        "type":"init",

        "content":contenido

    })

    try:

        while True:

            data = await ws.receive_text()

            try:
                msg = json.loads(data)
            except:
                continue

            if msg.get("action") == "next":

                contenido = {

                    "historia": obtener_siguiente_contenido(user_id,"historias"),

                    "ejercicio": obtener_siguiente_contenido(user_id,"ejercicios"),

                    "bienestar": obtener_siguiente_contenido(user_id,"bienestar")

                }

                await ws.send_json({

                    "type":"next",

                    "content":contenido

                })

    except WebSocketDisconnect:

        manager.disconnect(user_id)


# ---------------------------
# ROOT
# ---------------------------

@app.get("/")
async def root():

    with open("static/session.html","r",encoding="utf-8") as f:

        return HTMLResponse(f.read())
