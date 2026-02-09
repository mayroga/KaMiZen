import json
import random
import time
import stripe
import openai
import requests
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kamizen_global_2026")

# --- CONFIGURACIÓN DE APIS ---
openai.api_key = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# --- LÓGICA DE DATOS ---
def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando JSON: {e}")
        return {"biblioteca": {"paz": [{"texto": "Respira profundamente."}]}}

def obtener_ia_dual(prompt, idioma):
    idioma_nombre = "Español" if idioma == "es" else "English"
    instruccion = f"Idioma: {idioma_nombre}. Tono: Masculino, sabio y profundo. Eres el guía de KaMiZen."
   
    # 1. Intento con OpenAI
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": instruccion}, {"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except:
        # 2. Respaldo con Gemini API REST (Limpio)
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
            payload = {"contents": [{"parts": [{"text": f"{instruccion}\n{prompt}"}]}]}
            res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
            return res.json()['candidates'][0]['content']['parts'][0]['text']
        except:
            return "La sabiduría reside en el silencio. Continúa tu camino."

# --- RUTAS PRINCIPALES ---

@app.route('/')
def index():
    return render_template('index.html', stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/login', methods=['POST'])
def login():
    user = request.form.get('username')
    pw = request.form.get('password')
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session['access_granted'] = True
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
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

# --- API DE CONTENIDO PARA ESCENARIO Y JUEGOS ---

@app.route('/api/get_content')
def get_content():
    lang = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    categoria = random.choice(list(almacen['biblioteca'].keys()))
    item = random.choice(almacen['biblioteca'][categoria])
   
    reflexion = obtener_ia_dual(f"Explica brevemente esta frase: {item['texto']}", lang)
   
    return jsonify({
        "texto": item['texto'],
        "reflexion": reflexion,
        "audio_url": url_for('get_audio', text=reflexion)
    })

@app.route('/api/get_mental_challenge')
def get_mental_challenge():
    lang = request.args.get('lang', 'en')
    prompt = "Genera un acertijo de sabiduría con su respuesta y explicación breve."
    reflexion = obtener_ia_dual(prompt, lang)
    return jsonify({"pregunta": "Reto Mental", "explicacion": reflexion, "respuesta": "Mira en tu interior"})

@app.route('/api/get_ai_feedback')
def get_ai_feedback():
    prompt = request.args.get('prompt')
    lang = request.args.get('lang', 'en')
    respuesta = obtener_ia_dual(prompt, lang)
    return jsonify({"texto": respuesta})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', 'Zen')
    try:
        response = openai.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return "Error audio", 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
