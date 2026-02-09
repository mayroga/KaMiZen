import os
import json
import random
import stripe
import openai
import requests
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
# Usamos una clave segura; en producción se lee de las variables de entorno
app.secret_key = os.getenv("ADMIN_PASSWORD", "kamizen_2026")

# Configuración de APIs
openai.api_key = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def obtener_ia(prompt, idioma):
    """Cerebro de La Vida Continúa: Profesional, breve y con autoridad."""
    idioma_full = "Spanish" if idioma == "es" else "English"
    sistema = (
        f"Eres 'La Vida Continúa'. Un guía especialista en bienestar biopsicosocial, riqueza real y logística de vida. "
        f"Hablas en {idioma_full}. Tu tono es profesional, breve, con mucho peso y sabiduría. "
        "No eres una IA ni ChatGPT. Eres un asesor que resuelve y da instrucciones directas."
    )
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": f"{sistema}\n{prompt}"}]}]}
        res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        return res.json()['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"Error de conexión: {e}")
        return "Respira. La solución aparecerá con tu determinación."

# --- RUTAS DE NAVEGACIÓN ---

@app.route('/')
def index():
    return render_template('index.html', stripe_key=os.getenv("STRIPE_PUBLISHABLE_KEY"))

@app.route('/acceso_directo')
def acceso_directo():
    """Ruta para activar la sesión después del pago de $4.99 o similar."""
    session['access_granted'] = True
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/obstaculos')
def mostrar_obstaculos():
    """Sirve el HTML de obstáculos para el iframe del mapa."""
    if not session.get('access_granted'):
        return "Acceso denegado", 403
    return render_template('obstaculos_dinamicos.html')

# --- API DE CONTENIDO ---

@app.route('/api/get_story')
def get_story():
    lang = request.args.get('lang', 'es')
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            almacen = json.load(f)
        
        categoria = random.choice(almacen['biblioteca_historias'])
        historia_titulo = random.choice(categoria['historias'])
        
        prompt = f"Concepto: '{historia_titulo}'. Narra una instrucción de sabiduría breve para alcanzar estatus y paz."
        texto = obtener_ia(prompt, lang)
        
        return jsonify({
            "texto": texto,
            "audio_url": url_for('get_audio', text=texto)
        })
    except:
        return jsonify({"texto": "Sigue caminando con enfoque."})

@app.route('/api/get_obstaculo')
def get_obstaculo():
    lang = request.args.get('lang', 'es')
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        almacen = json.load(f)
    
    obs = random.choice(almacen['obstaculos_sistema'])
    prompt = f"Presenta este obstáculo: {obs['tipo']} - {obs['descripcion']}. Dile al usuario que debe decidir."
    texto = obtener_ia(prompt, lang)
    
    return jsonify({
        "tipo": obs['tipo'],
        "descripcion": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/get_ai_feedback')
def get_ai_feedback():
    prompt = request.args.get('prompt', '')
    lang = request.args.get('lang', 'es')
    texto = obtener_ia(prompt, lang)
    return jsonify({
        "texto": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    if not text: return "No text", 400
    try:
        response = openai.audio.speech.create(model="tts-1", voice="onyx", input=text)
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return "Audio error", 500

# --- EJECUCIÓN ---

if __name__ == '__main__':
    # Puerto dinámico para despliegue en la nube
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
