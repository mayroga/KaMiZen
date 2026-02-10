import os, json, random, time, openai, re
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def cargar_almacen():
    if os.path.exists('almacen_contenido.json'):
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"biblioteca": {"historias": []}}

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == "admin" and request.form.get('password') == app.secret_key:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time()})
        return redirect(url_for('servicio'))
    return redirect(url_for('index'))

@app.route('/api/get_sequence')
def get_sequence():
    if not session.get('start_time'): return jsonify({"error": "No session"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60
    
    # ESTRUCTURA CRONOMÉTRICA KaMiZen MEJORADA
    if elapsed < 1:
        tipo, prompt = "introduccion", "Saluda al caminante. Pregunta cómo se siente. Genera una frase corta de paz."
    elif elapsed < 3:
        tipo, prompt = "narrativa", "Narra una historia mística de poder y riqueza interna. Sé poético y profundo."
    elif elapsed < 5:
        tipo, prompt = "obstaculo", "Presenta un obstáculo: ENVIDIA u ODIO. Da dos opciones: 'Enfrentar' o 'Dejar pasar'."
    elif elapsed < 7:
        tipo, prompt = "juego", "Plantea una 'Adivinanza de Poder' sobre la sabiduría. Formato: Pregunta + 3 opciones numeradas."
    elif elapsed < 8.5:
        tipo, prompt = "rompecabezas", "Instruye al usuario a ordenar las piezas de su mente (simulado con imágenes)."
    else:
        tipo, prompt = "cierre", "Resume el viaje. Felicita por la astucia ganada. Menciona que el bienestar crece al compartir."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Eres KaMiZen. Voz sabia. Si es un juego, presenta la pregunta y luego las opciones claras. No digas IA."},
                {"role": "user", "content": prompt}
            ]
        )
        full_text = response.choices[0].message.content
        
        # Extraer opciones si es juego o obstáculo
        opciones = []
        if tipo == "obstaculo":
            opciones = ["Enfrentar", "Dejar pasar"]
        elif tipo == "juego":
            # Extrae líneas que parezcan opciones (ej: 1. Opción)
            opciones = re.findall(r'\d[\.\)\s]+([^\n]+)', full_text)
            if not opciones: opciones = ["Opción A", "Opción B", "Opción C"]

        # Imágenes para el rompecabezas (Unsplash dinámico)
        imagenes = []
        if tipo == "rompecabezas":
            imagenes = [
                "https://images.unsplash.com/photo-1518531966027-d78175ad23a9?w=200",
                "https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?w=200",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200"
            ]
            random.shuffle(imagenes)

        return jsonify({
            "tipo": tipo,
            "texto": full_text,
            "opciones": opciones,
            "imagenes": imagenes,
            "finalizado": elapsed >= 10
        })
    except Exception as e:
        return jsonify({"texto": "Sigue respirando, el camino continúa.", "tipo": "error"})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

if __name__ == '__main__':
    app.run(debug=True)
