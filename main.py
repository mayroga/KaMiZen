import os, json, random, time, stripe, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
# Seguridad: Uso de variable de entorno o clave por defecto segura
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    # Detectar rol para mostrar opciones de admin o pago
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
        return jsonify({"error": "No session active"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60  # minutos transcurridos
    almacen = cargar_almacen()
    lang = request.args.get('lang', 'es')
    
    # LÓGICA TVID (Técnica de Vida por tiempo)
    if elapsed < 1.5:
        tipo = "saludo"
        prompt = "Saluda al caminante con sabiduría. Pregúntale cómo se siente en este inicio de jornada hacia su riqueza interna."
    
    elif elapsed < 8.5:
        # Selección dinámica de contenido del almacén
        tipo = random.choice(['historia', 'obstaculo', 'virtud', 'juego'])
        
        if tipo == 'historia':
            item = random.choice(almacen['biblioteca']['historias_largas_sabiduria'])
            prompt = f"Narra con peso y profundidad esta historia: {item['texto']}"
        elif tipo == 'obstaculo':
            obs = random.choice(almacen['biblioteca']['obstaculo_reflexion'])
            prompt = f"El caminante enfrenta este desafío: {obs['texto']}. Aconséjalo sin ser autoritario."
        elif tipo == 'virtud':
            vir = random.choice(almacen['biblioteca']['triunfo_riqueza'])
            prompt = f"Háblale sobre la importancia de este triunfo: {vir['texto']}"
        else:
            prompt = "Plantea un reto mental breve para fortalecer la toma de decisiones del caminante."
            
    else:
        tipo = "final"
        prompt = "Estamos llegando al destino. Felicita al caminante por su constancia. Menciona que el bienestar crece al compartirse."

    # Generación con GPT-4o
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Eres KaMiZen. Voz masculina, sabia, profesional y cercana. No menciones que eres una IA. Habla con autoridad serena."},
                {"role": "user", "content": f"Idioma {lang}: {prompt}"}
            ]
        )
        texto = response.choices[0].message.content
        return jsonify({"tipo": tipo, "texto": texto, "finalizado": elapsed >= 10})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    if not text: return "No text provided", 400
    # Voz Onyx (Masculina, profesional)
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=False)
