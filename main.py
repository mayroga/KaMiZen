from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import random

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA_FILE = "session_data.json"

# --- BASE DE DATOS (AQUÍ RELLENARÁS LAS 300 FRASES) ---
db = {
  "historias": [
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
    "La decisión correcta es mejor que la acción rápida.",
    "Tus acciones de hoy definen tu libertad de mañana.",
    "Aprende a decir no para poder decir sí a lo importante.",
    "La resiliencia se construye enfrentando lo incómodo.",
    "La claridad de propósito evita la dispersión.",
    "El éxito financiero requiere más enfoque que suerte.",
    "La disciplina diaria supera la inspiración ocasional.",
    "El autocontrol multiplica tu efectividad.",
    "Cada meta necesita un plan y seguimiento.",
    "El liderazgo auténtico se basa en coherencia.",
    "No puedes controlar todo, pero sí tu respuesta.",
    "La preparación constante evita la improvisación.",
    "El ahorro inteligente es libertad futura.",
    "Toma decisiones basadas en hechos, no emociones.",
    "El crecimiento personal es la inversión más rentable.",
    "El éxito sostenible es silencioso y constante.",
    "Tus hábitos crean tu destino financiero.",
    "El miedo limita, la acción libera.",
    "Cada día es una oportunidad de progreso.",
    "El tiempo dedicado a aprender multiplica resultados.",
    "La claridad elimina la indecisión.",
    "Los grandes logros vienen de pequeños hábitos.",
    "Invierte en habilidades, no solo en dinero.",
    "El liderazgo requiere valentía y paciencia.",
    "Controla tu mente antes de controlar tus finanzas.",
    "El orden externo refleja el orden interno.",
    "No confíes en la motivación; crea sistemas.",
    "El éxito es el resultado de constancia aplicada.",
    "La inteligencia emocional supera al talento aislado.",
    "Cada esfuerzo disciplinado suma.",
    "Tu reputación es un activo intangible invaluable.",
    "La visión sin acción es solo un sueño.",
    "El tiempo perdido nunca regresa.",
    "La simplicidad en la acción genera eficiencia.",
    "El equilibrio personal aumenta la productividad.",
    "Aprende a priorizar antes de ejecutar.",
    "El autocontrol financiero es libertad real.",
    "La concentración es tu superpoder diario.",
    "Cada sacrificio de hoy es libertad futura.",
    "Los hábitos simples producen resultados exponenciales.",
    "Tu energía decide tu nivel de resultados.",
    "El liderazgo empieza contigo, no con los demás.",
    "Planifica hoy lo que quieres lograr mañana.",
    "La disciplina crea independencia.",
    "El aprendizaje continuo evita la obsolescencia.",
    "Cada error contiene una lección invaluable.",
    "La preparación supera a la improvisación.",
    "El progreso requiere constancia más que velocidad.",
    "El autocuidado es inversión, no gasto.",
    "El orden mental impulsa decisiones acertadas.",
    "El enfoque elimina distracciones.",
    "El éxito es acumulación de acciones correctas.",
    "La resiliencia financiera nace de hábitos sólidos.",
    "No postergues lo que puede cambiar tu vida hoy.",
    "La paciencia estratégica vence la gratificación instantánea.",
    "Tu actitud diaria define tu realidad.",
    "El ahorro constante vence al ingreso variable.",
    "Cada hábito positivo fortalece tu carácter.",
    "El conocimiento aplicado genera resultados.",
    "El liderazgo se demuestra en decisiones difíciles.",
    "Los grandes cambios requieren pequeños pasos.",
    "El control del presente crea libertad futura.",
    "El éxito requiere disciplina más que talento.",
    "Tu tranquilidad mental es un activo estratégico.",
    "El crecimiento financiero es gradual y constante.",
    "Cada día disciplinado suma al éxito.",
    "La claridad de objetivos evita la pérdida de tiempo.",
    "El liderazgo efectivo inspira confianza.",
    "El control emocional evita errores costosos.",
    "Tu enfoque define tu productividad.",
    "El progreso requiere constancia y paciencia.",
    "La visión clara guía la acción efectiva.",
    "El éxito se construye con hábitos sostenibles.",
    "Cada decisión informada fortalece tu futuro.",
    "El autocuidado mejora tu rendimiento.",
    "La disciplina supera al talento disperso.",
    "Los retos son oportunidades disfrazadas.",
    "El orden interno refleja el éxito externo.",
    "La constancia vence a la inspiración efímera.",
    "El tiempo invertido sabiamente se multiplica.",
    "El liderazgo responsable empieza en ti.",
    "El ahorro inteligente es libertad futura.",
    "Tus hábitos diarios construyen tu destino.",
    "Cada paso consciente te acerca a tu meta.",
    "El enfoque transforma ideas en resultados.",
    "La paciencia estratégica produce logros duraderos.",
    "El éxito real combina visión, acción y disciplina.",
    "El conocimiento aplicado genera poder.",
    "La resiliencia se entrena enfrentando lo difícil.",
    "El autocontrol protege tu progreso.",
    "Tu mente es la clave de tu éxito.",
    "La constancia diaria crea resultados visibles.",
    "El liderazgo se demuestra con coherencia y decisión.",
    "Cada hábito positivo suma a tu bienestar.",
    "La claridad de propósito evita distracciones.",
    "Tu enfoque diario decide tu futuro.",
    "El autocuidado es la base de la productividad.",
    "La disciplina financiera construye independencia.",
    "Cada meta requiere acción consciente.",
    "El progreso sostenido es fruto de hábitos consistentes.",
    "La paciencia y la constancia multiplican resultados.",
    "El tiempo dedicado al aprendizaje es inversión.",
    "El liderazgo efectivo inspira resultados tangibles.",
    "El autocontrol impulsa decisiones acertadas.",
    "La visión clara guía acciones estratégicas.",
    "Cada decisión informada fortalece tu libertad.",
    "El éxito es resultado de hábitos diarios sólidos.",
    "El crecimiento personal requiere constancia.",
    "Tu actitud define tu nivel de éxito.",
    "La claridad mental precede a la acción efectiva.",
    "El orden interno aumenta tu productividad.",
    "La disciplina silenciosa crea resultados visibles.",
    "Cada pequeño hábito genera grandes cambios.",
    "El liderazgo comienza con la responsabilidad personal.",
    "La resiliencia nace de enfrentar desafíos.",
    "Tu tiempo es el recurso más valioso.",
    "El ahorro constante genera libertad financiera.",
    "El enfoque elimina desperdicio de energía.",
    "Cada paso consciente construye tu futuro.",
    "El autocuidado protege tu rendimiento.",
    "La constancia vence a la motivación pasajera.",
    "El conocimiento aplicado multiplica resultados.",
    "El éxito financiero requiere estrategia y disciplina.",
    "Cada esfuerzo disciplinado suma a tu libertad.",
    "El liderazgo requiere paciencia y coherencia.",
    "La claridad de objetivos guía decisiones efectivas.",
    "El progreso sostenido se logra con hábitos consistentes.",
    "Tu actitud diaria impacta directamente en tu éxito.",
    "La paciencia estratégica vence la gratificación instantánea.",
    "El autocontrol financiero es libertad real.",
    "Cada hábito positivo fortalece tu carácter y resultados.",
    "El aprendizaje continuo evita la obsolescencia.",
    "La preparación constante evita la improvisación.",
    "El orden mental impulsa decisiones acertadas.",
    "El enfoque diario transforma ideas en resultados.",
    "La disciplina diaria crea independencia y libertad.",
    "Cada error contiene una lección invaluable.",
    "El tiempo invertido sabiamente se multiplica en resultados.",
    "El liderazgo se demuestra con acciones, no palabras.",
    "El éxito sostenible combina visión, disciplina y constancia."
  ],
  "ejercicios": [
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
    "Adivina: ¿Qué tiene llaves pero no puede abrir puertas? (Respuesta: Un piano)",
    "Calcula: 1000 ÷ 25.",
    "Si un auto recorre 60 km en 1 hora, ¿cuánto recorre en 3 horas?",
    "Reto: 14 x 5 - 20.",
    "Si tu ingreso mensual es $3,000 y ahorras el 15%, ¿cuánto ahorras?",
    "Si un tanque de agua tiene 120 litros y se usan 35 litros, ¿cuánto queda?",
    "Reto mental: 18 ÷ 3 + 7.",
    "Si un producto cuesta $80 y sube 15%, ¿cuál es su nuevo precio?",
    "Si trabajas 8 horas al día, ¿cuántas horas trabajas en 5 días?",
    "Reto: 25 x 4 + 60.",
    "Si ahorras $200 al mes, ¿cuánto tendrás en 1 año?",
    "Si un camión transporta 12 toneladas y hace 5 viajes, ¿cuántas toneladas transporta?",
    "Reto mental: 9 x 9.",
    "Si compras 3 camisetas a $25 cada una, ¿cuánto pagas?",
    "Si un viaje dura 2 horas y llegas 15 minutos tarde, ¿a qué hora llegaste?",
    "Reto: 11 x 12 - 50.",
    "Si ahorras $75 cada semana, ¿cuánto tendrás en 4 semanas?",
    "Si una caja tiene 48 chocolates y repartes 6 por niño, ¿cuántos niños reciben?",
    "Reto mental: 16 ÷ 4 + 9.",
    "Si un celular cuesta $600 y hay un 20% de descuento, ¿cuál es el precio final?",
    "Si recorres 5 km diarios, ¿cuánto habrás recorrido en 2 semanas?",
    "Reto: 30 ÷ 5 + 12.",
    "Si tu ingreso semanal es $450 y gastas $275, ¿cuánto te queda?",
    "Si un producto cuesta $150 y sube 10%, ¿cuál es su nuevo precio?",
    "Reto mental: 21 x 3 - 14.",
    "Si ahorras $120 al mes, ¿cuánto tendrás en 6 meses?",
    "Si tienes 5 cajas con 20 artículos cada una, ¿cuántos artículos hay en total?",
    "Reto: 7 x 13 - 15.",
    "Si un auto recorre 80 km en 2 horas, ¿cuánto recorre en 5 horas?",
    "Si compras 4 libros a $18 cada uno, ¿cuánto gastaste?",
    "Reto mental: 24 ÷ 6 + 11.",
    "Si tu salario es $2,500 y gastas $1,750, ¿cuánto ahorras?",
    "Si un tanque tiene 200 litros y se usan 75 litros, ¿cuánto queda?",
    "Reto: 6 x 8 + 9.",
    "Si ahorras $60 cada semana, ¿cuánto tendrás en 8 semanas?",
    "Si un camión transporta 10 toneladas y hace 7 viajes, ¿cuántas toneladas transporta?",
    "Reto mental: 13 x 7.",
    "Si compras 6 camisetas a $30 cada una, ¿cuánto pagas?",
    "Si un viaje dura 3 horas y llegas 20 minutos tarde, ¿a qué hora llegaste?",
    "Reto: 15 x 5 - 25.",
    "Si ahorras $90 cada mes, ¿cuánto tendrás en 1 año?",
    "Si una caja tiene 60 chocolates y repartes 10 por niño, ¿cuántos niños reciben?",
    "Reto mental: 12 ÷ 3 + 8.",
    "Si un celular cuesta $700 y hay un 15% de descuento, ¿cuál es el precio final?",
    "Si recorres 4 km diarios, ¿cuánto habrás recorrido en 3 semanas?",
    "Reto: 20 ÷ 4 + 17.",
    "Si tu ingreso semanal es $500 y gastas $320, ¿cuánto te queda?",
    "Si un producto cuesta $120 y sube 12%, ¿cuál es su nuevo precio?",
    "Reto mental: 14 x 6 - 18.",
    "Si ahorras $100 al mes, ¿cuánto tendrás en 6 meses?",
    "Si tienes 7 cajas con 15 artículos cada una, ¿cuántos artículos hay en total?",
    "Reto: 9 x 11 - 30.",
    "Si un auto recorre 50 km en 1 hora, ¿cuánto recorre en 4 horas?",
    "Si compras 3 libros a $22 cada uno, ¿cuánto gastaste?",
    "Reto mental: 18 ÷ 3 + 16.",
    "Si tu salario es $3,200 y gastas $2,100, ¿cuánto ahorras?",
    "Si un tanque tiene 150 litros y se usan 45 litros, ¿cuánto queda?",
    "Reto: 5 x 9 + 20.",
    "Si ahorras $80 cada semana, ¿cuánto tendrás en 10 semanas?",
    "Si un camión transporta 15 toneladas y hace 4 viajes, ¿cuántas toneladas transporta?"
  ],
  "bienestar": [
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
    "Recuerda que pausas cortas aumentan tu productividad.",
    "Relaja tus manos y muñecas; el estrés se acumula allí.",
    "Escucha un minuto de música que te haga sentir bien.",
    "Respira conscientemente al iniciar una nueva tarea.",
    "Da un pequeño paseo y cambia tu energía mental.",
    "Siente cada paso mientras caminas 1 minuto.",
    "Lleva atención a tus sentidos: escucha, mira, siente.",
    "Toma un respiro y observa tus pensamientos sin juzgar.",
    "Dedica 2 minutos a sonreír sin razón.",
    "Suelta tensión en tu mandíbula; relaja la boca.",
    "Observa tu entorno y encuentra algo positivo.",
    "Cierra los ojos y enfócate en tu respiración.",
    "Relaja hombros y cuello antes de seguir trabajando.",
    "Visualiza tu día ideal y tu bienestar completo.",
    "Haz 10 respiraciones profundas antes de empezar tarea difícil.",
    "Tómate un minuto para agradecer tu cuerpo y mente.",
    "Siente cómo tu respiración calma tu sistema nervioso.",
    "Estira brazos y piernas para mejorar circulación.",
    "Escucha tu respiración y relaja cada músculo.",
    "Visualiza metas alcanzadas y siente la satisfacción.",
    "Inhala energía, exhala tensión.",
    "Sonríe por 30 segundos y siente el cambio en tu ánimo.",
    "Cierra los ojos y enfócate en lo que puedes controlar.",
    "Respira lento y profundo antes de responder a un mensaje estresante.",
    "Toma un descanso breve y observa tu entorno.",
    "Haz respiraciones profundas antes de iniciar reunión.",
    "Siente tus pies en el suelo y conecta con el presente.",
    "Relaja la frente y cejas; suelta tensión mental.",
    "Visualiza tus logros y siente orgullo por ellos.",
    "Respira conscientemente antes de cada decisión financiera.",
    "Inhala positividad, exhala estrés.",
    "Haz estiramientos cortos para recargar energía.",
    "Siente tu corazón latiendo y agradece tu vida.",
    "Cierra ojos y respira profundamente 1 minuto.",
    "Observa pensamientos y déjalos pasar sin juicio.",
    "Relaja hombros y cuello; energía fluye mejor.",
    "Visualiza un espacio de calma y paz.",
    "Respira y suelta preocupaciones innecesarias.",
    "Haz 5 respiraciones profundas antes de un reto.",
    "Observa tu postura y ajústala para sentirte mejor.",
    "Escucha sonidos de tu entorno y relájate.",
    "Tómate un momento para sonreír y sentir gratitud.",
    "Respira profundo y enfócate en tu bienestar."
  ]
}

# --- MOTOR DE PERSISTENCIA ---
def cargar_historial():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f: return json.load(f)
        except: return {}
    return {}

def guardar_historial(historial):
    with open(DATA_FILE, "w") as f: json.dump(historial, f)

def obtener_siguiente_contenido(user_id, categoria):
    historial = cargar_historial()
    if user_id not in historial:
        historial[user_id] = {"historias": [], "ejercicios": [], "bienestar": []}
    
    vistas = historial[user_id][categoria]
    disponibles = [item for item in db[categoria] if item not in vistas]
    
    if not disponibles:
        historial[user_id][categoria] = []
        disponibles = db[categoria]
        
    seleccion = random.choice(disponibles)
    historial[user_id][categoria].append(seleccion)
    guardar_historial(historial)
    return seleccion

# --- GESTOR DE CONEXIONES ---
class Manager:
    def __init__(self): self.connections = {}
    async def connect(self, ws: WebSocket, uid: str):
        await ws.accept()
        self.connections[uid] = ws
    def disconnect(self, uid: str):
        if uid in self.connections: del self.connections[uid]

manager = Manager()

# --- ENDPOINT WEBSOCKET ---
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(ws: WebSocket, user_id: str):
    await manager.connect(ws, user_id)
    
    # Enviar contenido único del día
    contenido = {
        "historia": obtener_siguiente_contenido(user_id, "historias"),
        "ejercicio": obtener_siguiente_contenido(user_id, "ejercicios"),
        "bienestar": obtener_siguiente_contenido(user_id, "bienestar")
    }
    
    await ws.send_json({"type": "init", "content": contenido})
    
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())
