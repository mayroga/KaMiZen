import os
import json
import random
import time
import stripe
import openai
import google.generativeai as genai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kamizen_global_key_2026")

# --- CONFIGURACIÓN DE APIS (RENDER) ---
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def obtener_reflexion_ia(texto_base, idioma):
    idioma_nombre = "Español" if idioma == "es" else "English"
    prompt = f"Frase base: '{texto_base}'. Genera una reflexión de sabiduría profunda y breve. Idioma: {idioma_nombre}. Tono: Masculino y calmado."
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "Eres el guía de KaMiZen."},
                      {"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except:
        model = genai.GenerativeModel('gemini-pro')
        res = model.generate_content(prompt)
        return res.text

@app.route('/')
def index():
    return render_template('index.html', stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/login', methods=['POST'])
def login():
    user = request.form.get('username')
    pw = request.form.get('password')
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session['access_granted'] = True
        session['role'] = 'admin'
        return redirect(url_for('servicio'))
    return "Acceso denegado", 401

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
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_content')
def get_content():
    lang = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    categoria = random.choice(list(almacen['biblioteca'].keys()))
    item = random.choice(almacen['biblioteca'][categoria])
    reflexion = obtener_reflexion_ia(item['texto'], lang)
    return jsonify({"texto": item['texto'], "reflexion": reflexion})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = openai.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=False)
