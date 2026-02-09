import os, json, random, time, stripe, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Carga de Sabiduría ---
def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"biblioteca": {"triunfo_riqueza": [], "historias_largas_sabiduria": []}}

# --- Navegación y Flujo ---
@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    # Iniciamos el conteo de los 10 minutos si no existe
    if 'start_time' not in session:
        session['start_time'] = time.time()
    return render_template('escenario_mapa.html')

@app.route('/bienestar_final')
def bienestar_final():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('bienestar_final.html')

@app.route('/logout')
def logout():
    session.clear() # Regla 5 y 15: Estado limpio siempre
    return redirect(url_for('index'))

# --- API de Contenido Dinámico ---
@app.route('/api/get_event')
def get_event():
    # Verificar si el tiempo de sesión (10 min) ha expirado
    elapsed = time.time() - session.get('start_time', time.time())
    if elapsed > 600: # 10 minutos
        return jsonify({"redirect": "/bienestar_final"})

    lang = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    
    # Lógica de no repetición dentro de la sesión
    if 'used_ids' not in session: session['used_ids'] = []
    
    pool = [h for h in almacen['biblioteca']['historias_largas_sabiduria'] if h['id'] not in session['used_ids']]
    if not pool: pool = almacen['biblioteca']['historias_largas_sabiduria']
    
    item = random.choice(pool)
    session['used_ids'].append(item['id'])
    session.modified = True

    prompt = f"Eres KaMiZen. Adapta esta historia al idioma {lang} con voz masculina y sabia: {item['texto']}"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "Voz sabia, sin listas, sin mencionar que eres IA."},
                  {"role": "user", "content": prompt}]
    )
    return jsonify({"contenido": response.choices[0].message.content, "redirect": None})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=False)
