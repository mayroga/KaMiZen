import os
import json
import random
import time
import stripe
import openai
import google.generativeai as genai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
# Usa tu ADMIN_PASSWORD de Render como clave de sesión
app.secret_key = os.getenv("ADMIN_PASSWORD", "clave_de_seguridad_kamizen")

# --- CONFIGURACIÓN DE APIS DESDE RENDER ---
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# --- CARGA DEL ALMACÉN ---
def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# --- MOTOR DE INTELIGENCIA DUAL ---
def obtener_reflexion_ia(texto_base, idioma):
    prompt = f"Basado en esta frase: '{texto_base}', genera una reflexión breve de sabiduría. Idioma: {idioma}. Tono: Masculino, profundo y calmado."
    try:
        # Intento principal: OpenAI
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "Eres el guía sabio de KaMiZen."},
                      {"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except:
        # Respaldo: Gemini
        model = genai.GenerativeModel('gemini-pro')
        res = model.generate_content(prompt)
        return res.text

# --- RUTAS ---

@app.route('/')
def index():
    return render_template('index.html', stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/login', methods=['POST'])
def login():
    """Acceso Administrativo Gratuito"""
    user = request.form.get('username')
    pw = request.form.get('password')
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session['access_granted'] = True
        session['role'] = 'admin'
        return redirect(url_for('servicio'))
    return "Acceso No Autorizado", 401

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price_data': {'currency': 'usd', 'product_data': {'name': 'KaMiZen Session'}, 'unit_amount': 499}, 'quantity': 1}],
            mode='payment',
            success_url=url_for('pago_exitoso', _external=True),
            cancel_url=url_for('index', _external=True),
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route('/pago-exitoso')
def pago_exitoso():
    session['access_granted'] = True
    session['role'] = 'client'
    session['start_time'] = time.time()
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_content')
def get_content():
    idioma = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    categoria = random.choice(list(almacen['biblioteca'].keys()))
    item = random.choice(almacen['biblioteca'][categoria])
    
    reflexion = obtener_reflexion_ia(item['texto'], idioma)
    
    return jsonify({
        "texto": item['texto'],
        "reflexion": reflexion,
        "audio_url": url_for('get_audio', text=reflexion)
    })

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = openai.audio.speech.create(
        model="tts-1-hd",
        voice="onyx", # Voz masculina profunda
        input=text
    )
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=False)
