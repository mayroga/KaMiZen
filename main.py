import os
import json
import random
import stripe
import openai
import requests
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kamizen_2026")

# Configuración
openai.api_key = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def obtener_ia(prompt, idioma):
    idioma_full = "Spanish" if idioma == "es" else "English"
    sistema = (
        f"Eres 'La Vida Continúa'. Guía de KaMiZen. Especialista en bienestar y riqueza real. "
        f"Hablas en {idioma_full}. Tu tono es profesional, breve, con mucho peso. "
        "No eres una IA. Resuelves y asesoras con autoridad."
    )
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": f"{sistema}\n{prompt}"}]}]}
        res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        return res.json()['candidates'][0]['content']['parts'][0]['text']
    except:
        return "El silencio es parte del camino. Respira y avanza."

@app.route('/')
def index():
    return render_template('index.html', stripe_key=os.getenv("STRIPE_PUBLISHABLE_KEY"))

# RUTA DE ACCESO GRATIS O POST-PAGO
@app.route('/activar_acceso')
def activar_acceso():
    session['access_granted'] = True
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): 
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/obstaculos')
def obstaculos():
    return render_template('obstaculos_dinamicos.html')

# --- API ---

@app.route('/api/get_story')
def get_story():
    lang = request.args.get('lang', 'es')
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            almacen = json.load(f)
        cat = random.choice(almacen['biblioteca_historias'])
        hist = random.choice(cat['historias'])
        texto = obtener_ia(f"Instrucción breve sobre: {hist}", lang)
        return jsonify({"texto": texto, "audio_url": url_for('get_audio', text=texto)})
    except:
        return jsonify({"texto": "Mantén el enfoque en tu riqueza interior."})

@app.route('/api/get_obstaculo')
def get_obstaculo():
    lang = request.args.get('lang', 'es')
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        almacen = json.load(f)
    obs = random.choice(almacen['obstaculos_sistema'])
    texto = obtener_ia(f"Presenta este reto: {obs['descripcion']}", lang)
    return jsonify({"tipo": obs['tipo'], "descripcion": texto, "audio_url": url_for('get_audio', text=texto)})

@app.route('/api/get_ai_feedback')
def get_ai_feedback():
    prompt = request.args.get('prompt', '')
    lang = request.args.get('lang', 'es')
    texto = obtener_ia(prompt, lang)
    return jsonify({"texto": texto, "audio_url": url_for('get_audio', text=texto)})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    try:
        response = openai.audio.speech.create(model="tts-1", voice="onyx", input=text)
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return "", 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
