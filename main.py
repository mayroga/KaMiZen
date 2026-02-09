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

def obtener_ia(prompt, idioma, tipo="sabio"):
    # Tono estricto: Nunca decir IA, siempre ser "La Vida Continúa"
    idioma_full = "Spanish" if idioma == "es" else "English"
    sistema = f"Eres 'La Vida Continúa'. Un guía espiritual y financiero. Hablas en {idioma_full}. Tu voz es calmada. No eres una IA. Ayudas al usuario a alcanzar el bienestar biopsicosocial."
    
    try:
        # Intento con Gemini REST para evitar librerías pesadas
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": f"{sistema}\n{prompt}"}]}]}
        res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        return res.json()['candidates'][0]['content']['parts'][0]['text']
    except:
        return "Respira. El camino se aclara con tu presencia."

@app.route('/')
def index():
    return render_template('index.html', stripe_key=os.getenv("STRIPE_PUBLISHABLE_KEY"))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

# --- EL FLUJO DE LA EXPERIENCIA (API) ---

@app.route('/api/inicio_viaje')
def inicio_viaje():
    lang = request.args.get('lang', 'en')
    # La Vida Continúa saluda y pregunta por el punto de partida
    prompt = "Saluda al usuario con mucha calidez, pregúntale cómo se siente hoy y desde qué lugar del mundo (su punto A) inicia su viaje hacia el bienestar."
    texto = obtener_ia(prompt, lang)
    return jsonify({
        "texto": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/get_story')
def get_story():
    lang = request.args.get('lang', 'en')
    almacen = json.load(open('almacen_contenido.json'))
    historia_raw = random.choice(almacen['historias_exito'])
    
    prompt = f"Basándote en esta trama: {historia_raw['trama']}, narra una historia corta e inspiradora de riqueza y poder real. Que sea envolvente y termine con una lección de sabiduría."
    historia_final = obtener_ia(prompt, lang)
    
    return jsonify({
        "texto": historia_final,
        "audio_url": url_for('get_audio', text=historia_final)
    })

@app.route('/api/get_obstaculo')
def get_obstaculo():
    lang = request.args.get('lang', 'en')
    almacen = json.load(open('almacen_contenido.json'))
    obs = random.choice(almacen['obstaculos'])
    
    prompt = f"Presenta este obstáculo al usuario: {obs['descripcion']}. Explícale que puede 'Quitarlo' (acción), 'Rodearlo' (astucia) o 'No hacer nada' (paciencia). Dile que tú, como su guía, entenderás su decisión."
    texto = obtener_ia(prompt, lang)
    
    return jsonify({
        "tipo": obs['tipo'],
        "descripcion": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/cierre_publicitario')
def cierre():
    lang = request.args.get('lang', 'en')
    prompt = "Felicita al usuario por sus 10 minutos de avance. Haz una invitación elegante a seguir usando 'AL CIELO' para mantener su estatus y paz mental. Recuérdale que el bienestar es la mejor inversión."
    texto = obtener_ia(prompt, lang)
    return jsonify({
        "texto": texto,
        "audio_url": url_for('get_audio', text=texto)
    })

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = openai.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
