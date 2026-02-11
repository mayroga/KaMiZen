import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == "admin" and request.form.get('password') == app.secret_key:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time()})
        return redirect(url_for('servicio'))
    return redirect(url_for('index'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_sequence')
def get_sequence():
    if not session.get('start_time'): return jsonify({"error": "No session"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60
    almacen = cargar_almacen()
    
    # ESTRUCTURA CRONOMÉTRICA KaMiZen
    if elapsed < 1:
        tipo, prompt = "introduccion", "Saluda al caminante. Pregunta cómo se siente. Genera una frase corta de paz interior."
    elif elapsed < 3:
        tipo, prompt = "narrativa", "Narra una historia mística corta sobre un bosque dorado y la fuerza interna. Sé poético."
    elif elapsed < 5:
        tipo, prompt = "obstaculo", "Presenta un obstáculo: Envidia u Odio. Da dos opciones: Enfrentar o Dejar pasar."
    elif elapsed < 7:
        tipo, prompt = "juego", "Plantea un acertijo de lógica o adivinanza breve sobre la sabiduría. Da 3 opciones de respuesta."
    elif elapsed < 9:
        tipo, prompt = "riqueza", "Cuenta una historia breve de un gran emperador o sabio que encontró la riqueza en el conocimiento."
    else:
        tipo, prompt = "cierre", "Resume el viaje. Dile que su astucia ha crecido. Invítalo a volver mañana."

    try:
        # Forzamos a la IA a generar algo ÚNICO siempre
        seed = random.randint(1, 1000000)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Eres KaMiZen. Voz sabia, mística y profesional. ID de sesión única: {seed}. No repitas frases anteriores."},
                {"role": "user", "content": prompt}
            ]
        )
        texto = response.choices[0].message.content
        
        # Frases flotantes aleatorias para rellenar si la voz es corta
        frases_flotantes = [
            "El obstáculo es el camino", "Tu mente es un jardín", "La paz es claridad", 
            "La riqueza es interna", "Respira el presente"
        ]
        
        return jsonify({
            "tipo": tipo,
            "texto": texto,
            "frase_flotante": random.choice(frases_flotantes),
            "finalizado": elapsed >= 10,
            "opciones": ["Aceptar", "Dejar pasar"] if tipo == "obstaculo" else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=True)
