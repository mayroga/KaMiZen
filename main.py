import os, json, random, time, stripe, openai
from google import genai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_safe_key")

# --- CONFIGURACIÓN ---
openai.api_key = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def obtener_reflexion_ia(texto_base, idioma):
    # Prompt de alto peso: narrativo, humano, sin estructuras de IA
    prompt = f"Basado en: '{texto_base}'. Habla como un asesor sabio. Genera una sola reflexión humana, profunda y breve. Sin listas, sin asteriscos, sin introducciones. Idioma: {idioma}."
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres la voz de KaMiZen. Hablas con pausas, sabiduría y autoridad calma. No eres una IA, eres un guía."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except:
        client = genai.Client(api_key=GEMINI_API_KEY)
        res = client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
        return res.text

@app.route('/')
def index():
    return render_template('index.html', stripe_key=os.getenv("STRIPE_PUBLISHABLE_KEY"))

@app.route('/pago-exitoso')
def pago_exitoso():
    session.clear() # Limpieza preventiva
    session['access_granted'] = True
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
    # Selección de peso: historias largas o triunfos
    cat = random.choice(['triunfo_riqueza', 'historias_largas_sabiduria'])
    item = random.choice(almacen['biblioteca'][cat])
    
    reflexion = obtener_reflexion_ia(item['texto'], idioma)
    return jsonify({"texto": item['texto'], "reflexion": reflexion})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = openai.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=False)
