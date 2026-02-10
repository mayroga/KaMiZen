import os, json, random, time, stripe, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"biblioteca": {"historias_largas_sabiduria": [{"texto": "El éxito es constancia."}], "triunfo_riqueza": [{"texto": "Cree en ti."}], "obstaculo_reflexion": [{"texto": "Supera la duda."}]}}

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'), stripe_public_key=os.getenv("STRIPE_PUBLIC_KEY"))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == ADMIN_USERNAME and request.form.get('password') == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time()})
        return redirect(url_for('servicio'))
    return redirect(url_for('index'))

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout():
    # Simulación de sesión de Stripe para activar el flujo
    return jsonify({"id": "session_mock_123"}) 

@app.route('/pago_exitoso')
def pago_exitoso():
    session.update({'access_granted': True, 'role': 'client', 'start_time': time.time()})
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_sequence')
def get_sequence():
    if not session.get('start_time'): 
        return jsonify({"texto": "Iniciando sesión...", "tipo": "espera"}), 200
    
    elapsed = (time.time() - session['start_time']) / 60
    almacen = cargar_almacen()
    lang = request.args.get('lang', 'es')
    
    if elapsed < 1.5:
        tipo, prompt = "saludo", "Saluda al caminante. Pregúntale cómo se siente hoy en su inicio."
    elif elapsed < 8.5:
        tipo = random.choice(['historia', 'obstaculo', 'virtud', 'juego'])
        if tipo == 'historia':
            item = random.choice(almacen['biblioteca']['historias_largas_sabiduria'])
            prompt = f"Narra esta historia de éxito: {item['texto']}"
        elif tipo == 'obstaculo':
            item = random.choice(almacen['biblioteca']['obstaculo_reflexion'])
            prompt = f"Asesora sobre este obstáculo: {item['texto']}"
        else:
            prompt = "Propón un ejercicio mental breve de agudeza."
    else:
        tipo, prompt = "final", "Felicita al usuario por completar su camino de 10 minutos."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Eres KaMiZen. Voz masculina, sabia. No digas IA."},
                      {"role": "user", "content": f"Idioma {lang}: {prompt}"}]
        )
        return jsonify({"tipo": tipo, "texto": response.choices[0].message.content, "finalizado": elapsed >= 10})
    except:
        return jsonify({"tipo": "error", "texto": "El camino sigue, respira profundo."})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', 'Respiración consciente.')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
