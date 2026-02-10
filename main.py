import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

def cargar_almacen():
    try:
        if os.path.exists('almacen_contenido.json'):
            with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
                return json.load(f)
    except:
        pass
    return {"biblioteca": {"historias_largas_sabiduria": [{"texto": "La constancia es riqueza."}]}}

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == ADMIN_USERNAME and request.form.get('password') == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time()})
        return redirect(url_for('servicio'))
    return redirect(url_for('index'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_sequence')
def get_sequence():
    if not session.get('start_time'):
        return jsonify({"texto": "Iniciando...", "finalizado": False})
    
    elapsed = (time.time() - session['start_time']) / 60
    almacen = cargar_almacen()
    
    if elapsed < 1.5:
        prompt = "Saluda brevemente al caminante."
    elif elapsed < 8.5:
        prompt = "Da un consejo de sabiduría sobre riqueza interna."
    else:
        prompt = "Felicita al usuario por terminar."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Eres KaMiZen. Voz masculina sabia."},
                      {"role": "user", "content": prompt}]
        )
        return jsonify({"texto": response.choices[0].message.content, "finalizado": elapsed >= 10})
    except:
        return jsonify({"texto": "Sigue adelante.", "finalizado": False})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', 'Respirar.')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
