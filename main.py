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
    # Instrucciones de personalidad SmartCargo / La Vida Continúa
    sistema = (
        f"Eres 'La Vida Continúa'. Un guía especialista en bienestar biopsicosocial y riqueza real. "
        f"Hablas en {idioma_full}. Tu tono es profesional, breve pero de gran peso y sabiduría. "
        "No eres una IA ni ChatGPT. Resuelves y asesoras con autoridad calmada."
    )
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": f"{sistema}\n{prompt}"}]}]}
        res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        return res.json()['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"Error IA: {e}")
        return "Respira. El camino se aclara con tu presencia y determinación."

@app.route('/')
def index():
    return render_template('index.html', stripe_key=os.getenv("STRIPE_PUBLISHABLE_KEY"))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

# --- EL FLUJO DE LA EXPERIENCIA ACTUALIZADO ---

@app.route('/api/get_story')
def get_story():
    lang = request.args.get('lang', 'en')
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        almacen = json.load(f)
    
    # Selecciona una categoría y una historia al azar
    categoria = random.choice(almacen['biblioteca_historias'])
    historia_titulo = random.choice(categoria['historias'])
    
    prompt = f"Basado en este concepto: '{historia_titulo}', narra una reflexión poderosa y breve sobre riqueza y paz mental. Que sea una lección de vida que impacte."
    historia_final = obtener_ia(prompt, lang)
    
    return jsonify({
        "texto": historia_final,
        "audio_url": url_for('get_audio', text=historia_final)
    })

@app.route('/api/get_obstaculo')
def get_obstaculo():
    lang = request.args.get('lang', 'en')
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        almacen = json.load(f)
    
    obs = random.choice(almacen['obstaculos_sistema'])
    opciones_str = ", ".join(obs['opciones'])
    
    prompt = f"El usuario se enfrenta a: {obs['tipo']} ({obs['descripcion']}). Presenta este reto y las opciones: {opciones_str}. Guíalo a elegir con sabiduría."
    texto = obtener_ia(prompt, lang)
    
    return jsonify({
        "tipo": obs['tipo'],
        "descripcion": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/cierre_publicitario')
def cierre():
    lang = request.args.get('lang', 'en')
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        almacen = json.load(f)
    
    frase_final = random.choice(almacen['propaganda_final'])
    prompt = f"Usa esta idea para cerrar la sesión de 10 minutos: '{frase_final}'. Despídete con elegancia y autoridad."
    texto = obtener_ia(prompt, lang)
    
    return jsonify({
        "texto": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    try:
        response = openai.audio.speech.create(model="tts-1", voice="onyx", input=text)
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return "", 404
@app.route('/api/get_ai_feedback')
def get_ai_feedback():
    prompt = request.args.get('prompt', '')
    lang = request.args.get('lang', 'es')
    texto = obtener_ia(prompt, lang)
    return jsonify({
        "texto": texto,
        "audio_url": url_for('get_audio', text=texto)
    })
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
