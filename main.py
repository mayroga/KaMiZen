import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"biblioteca": {"historias": []}}

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == "admin" and request.form.get('password') == app.secret_key:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time(), 'lang': 'es'})
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
    lang = session.get('lang', 'es')
    
    # Lógica de bloques de tiempo
    opciones = None
    juego_imagenes = False

    if elapsed < 1:
        tipo, prompt = "introduccion", "Saluda brevemente y pregunta cómo se siente el alma hoy."
    elif elapsed < 4:
        tipo, prompt = "narrativa", "Cuenta una historia de 40 segundos sobre el poder del enfoque y la riqueza interna."
    elif elapsed < 6:
        tipo = "juego_mental"
        prompt = "Plantea una 'Adivinanza de Poder'. Debe ser un reto de sabiduría. Devuelve: La adivinanza y 3 opciones cortas."
        opciones = ["Sabiduría", "Tiempo", "Silencio"] # Ejemplo, la IA lo personalizará
    elif elapsed < 8:
        tipo = "rompecabezas"
        prompt = "Instruye al usuario a que ordene las imágenes de su mente. Describe 3 elementos sagrados para ordenar."
        juego_imagenes = True
    else:
        tipo, prompt = "cierre", "Finaliza el viaje. Resalta que su astucia ha despertado. Bienestar biopsicosocial."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Eres KaMiZen. Voz sabia. Idioma: {lang}. Nunca digas IA. Si es adivinanza, sé breve y místico."},
                {"role": "user", "content": prompt}
            ]
        )
        texto = response.choices[0].message.content
        
        return jsonify({
            "tipo": tipo,
            "texto": texto,
            "finalizado": elapsed >= 10,
            "opciones": opciones if tipo in ["juego_mental", "obstaculo"] else None,
            "juego_imagenes": juego_imagenes,
            "lang": lang
        })
    except Exception as e:
        return jsonify({"texto": "El camino se aclara con tu respiración...", "tipo": "espera"})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    # La voz Onyx es perfecta para este tono místico
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
