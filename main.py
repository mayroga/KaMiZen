import os
import json
import random
import time
import stripe
import openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

# --- CONFIGURACIÓN DE APIs ---
openai.api_key = os.getenv("OPENAI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# --- CARGA DEL ALMACÉN ---
def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# --- RUTAS ---
@app.route('/')
def index():
    return render_template('index.html', stripe_key=STRIPE_PUBLISHABLE_KEY)

# Login administrativo (acceso gratuito)
@app.route('/login', methods=['POST'])
def login():
    user = request.form.get('username')
    pw = request.form.get('password')
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session['access_granted'] = True
        session['role'] = 'admin'
        session['start_time'] = time.time()
        return redirect(url_for('servicio'))
    return "No autorizado", 401

# Crear sesión de pago con Stripe
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': 'KaMiZen Session'},
                    'unit_amount': 499
                },
                'quantity': 1
            }],
            mode='payment',
            success_url=url_for('pago_exitoso', _external=True),
            cancel_url=url_for('index', _external=True),
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

# Pago exitoso
@app.route('/pago-exitoso')
def pago_exitoso():
    session['access_granted'] = True
    session['role'] = 'client'
    session['start_time'] = time.time()
    return redirect(url_for('servicio'))

# Página de servicio / mapa
@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

# Generación de eventos / reflexiones
@app.route('/api/get_event')
def get_event():
    lang = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    
    tipos = ['historia', 'obstaculo', 'virtud', 'juego']
    tipo = random.choice(tipos)
    
    prompt_base = ""
    if tipo == 'historia':
        item = random.choice(almacen['biblioteca']['historias_largas_sabiduria'])
        prompt_base = item['texto']
    elif tipo == 'obstaculo':
        obs = random.choice(["la envidia", "el rendirse", "el odio", "las malas compañías", "la vagancia"])
        prompt_base = f"El caminante encuentra {obs} en su camino. Da un consejo de sabiduría para superarlo."
    elif tipo == 'virtud':
        vir = random.choice(["la perseverancia", "el amor", "la astucia", "la inteligencia", "el trabajo"])
        prompt_base = f"El caminante abraza {vir}. Explica cómo esto le acerca a la riqueza y grandeza personal."
    else:
        prompt_base = "Genera una adivinanza o reto mental breve para relajar la mente."
    
    # IA genera reflexión
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres KaMiZen. Voz masculina, calmada, sabia. No uses listas ni etiquetas."},
                {"role": "user", "content": f"Idioma: {lang}. {prompt_base}"}
            ]
        )
        reflexion = response.choices[0].message.content
    except:
        reflexion = prompt_base  # fallback simple
    return jsonify({"tipo": tipo, "contenido": reflexion})

# Generación de audio
@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    try:
        response = openai.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",
            input=text
        )
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return f"[Error generando audio]", 500

if __name__ == '__main__':
    app.run(debug=False)
