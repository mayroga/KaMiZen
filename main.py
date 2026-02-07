from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import stripe
import os
import random
import datetime

app = Flask(__name__)
CORS(app)
app.secret_key = os.urandom(24)

# Stripe configuration
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")  # clave secreta en Render
STRIPE_PUBLISHABLE_KEY = "pk_live_51NqPxQBOA5mT4t0PEoRVRc0Sj7DugiHvxhozC3BYh0q0hAx1N3HCLJe4xEp3MSuNMA6mQ7fAO4mvtppqLodrtqEn00pgJNQaxz"

# --- Blindaje legal robusto ---
LEGAL_TEXT = """
<strong>Consentimiento y Aviso Legal - KaMiZen by May Roga LLC</strong><br><br>
1. La aplicación KaMiZen by May Roga LLC es una experiencia interactiva de bienestar personal y entretenimiento educativo.<br>
2. No sustituye terapia psicológica, médica ni profesional. No garantiza resultados, riqueza, éxito o bienestar físico o emocional.<br>
3. Todo el contenido (historias, frases, microacciones, juegos) es generado dinámicamente por IA. Puede contener errores o ser interpretativo.<br>
4. El usuario asume plena responsabilidad por su participación. Cualquier acción tomada es voluntaria.<br>
5. MAY ROGA LLC no se hace responsable de daños, pérdidas o expectativas no alcanzadas.<br>
6. La información personal se maneja bajo las leyes de privacidad vigentes.<br><br>
Al hacer clic en "Acepto", usted confirma que entiende y acepta estas condiciones, y autoriza el uso de la app según los términos indicados.
"""

# --- Mini-juegos, frases, historias y microacciones ---
HISTORIAS = [
    "Un emprendedor que nunca se rindió ante sus fracasos logró construir su imperio.",
    "Cada caída es un paso hacia la cima si aprendes de ella.",
    "La disciplina diaria convierte sueños en resultados concretos."
]

FRASES = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "Cree en ti y el mundo creerá contigo.",
    "Lo que hoy parece difícil, mañana será tu mayor logro."
]

MICROACCIONES = [
    "Respira profundamente y visualiza tu objetivo.",
    "Escribe una acción pequeña que puedas hacer hoy para acercarte a tu meta.",
    "Piensa en algo por lo que estés agradecido y sonríe."
]

JUEGOS = [
    {"pregunta": "Si 2+3=5 y 5+4=?, ¿cuál es la respuesta?", "respuesta": "9"},
    {"pregunta": "Adivina el animal: Tiene rayas y vive en la sabana.", "respuesta": "Cebra"},
    {"pregunta": "Rompecabezas de palabras: Ordena las letras 'A L M O N E' para formar un fruto.", "respuesta": "Melón"}
]

OBSTACULOS = ["Miedo", "Procrastinación", "Dudas", "Perseverancia baja"]

MAP_ELEMENTS = [
    {"tipo": "auto", "nombre": "Auto de lujo"},
    {"tipo": "mansion", "nombre": "Mansión"},
    {"tipo": "bote", "nombre": "Bote"},
    {"tipo": "dinero", "nombre": "Riqueza"}
]

# --- Routes ---

@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY, legal_text=LEGAL_TEXT)

@app.route("/accept_legal", methods=["POST"])
def accept_legal():
    session["legal_accepted"] = True
    session["legal_timestamp"] = str(datetime.datetime.now())
    return jsonify({"success": True})

@app.route("/start_experience", methods=["POST"])
def start_experience():
    if not session.get("legal_accepted"):
        return jsonify({"error": "Debe aceptar el consentimiento legal antes de continuar."}), 403
    
    data = request.json
    estado_inicial = data.get("estado_inicial", "neutral")
    
    # Generar experiencia de 10 minutos
    experiencia = {
        "estado_inicial": estado_inicial,
        "historias": random.sample(HISTORIAS, len(HISTORIAS)),
        "frases": random.sample(FRASES, len(FRASES)),
        "microacciones": random.sample(MICROACCIONES, len(MICROACCIONES)),
        "juegos": random.sample(JUEGOS, len(JUEGOS)),
        "obstaculos": random.sample(OBSTACULOS, len(OBSTACULOS)),
        "map_elements": random.sample(MAP_ELEMENTS, len(MAP_ELEMENTS)),
        "destino_final": "Bienestar biosicosocial"
    }
    return jsonify(experiencia)

@app.route("/create_checkout_session", methods=["POST"])
def create_checkout_session():
    try:
        session_stripe = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Experiencia KaMiZen Premium 10 minutos"
                    },
                    "unit_amount": 999
                },
                "quantity": 1
            }],
            mode="payment",
            success_url="https://kamizen.onrender.com/success",
            cancel_url="https://kamizen.onrender.com/cancel"
        )
        return jsonify({"id": session_stripe.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route("/success")
def success():
    return "<h1>¡Pago exitoso! Acceso completo a tu experiencia KaMiZen Premium.</h1>"

@app.route("/cancel")
def cancel():
    return "<h1>Pago cancelado. Puedes intentarlo nuevamente.</h1>"

if __name__ == "__main__":
    app.run(debug=True)
