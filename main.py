import os, json, random, time, stripe, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Configuración Admin y Stripe ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"biblioteca": {"triunfo_riqueza": [], "historias_largas_sabiduria": []}}

@app.route('/')
def index():
    return render_template('index.html', stripe_key=STRIPE_PUBLISHABLE_KEY, role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    user = request.form.get('username')
    pw = request.form.get('password')
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session['access_granted'] = True
        session['role'] = 'admin'
        session['start_time'] = time.time()
        return redirect(url_for('servicio'))
    return redirect(url_for('index')) # Sin mensajes de error según el manual

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price_data': {'currency': 'usd', 'product_data': {'name': 'KaMiZen Session'}, 'unit_amount': 499}, 'quantity': 1}],
            mode='payment',
            success_url=url_for('pago_exitoso', _external=True),
            cancel_url=url_for('index', _external=True),
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify(error="Error de proceso"), 403

@app.route('/pago_exitoso')
def pago_exitoso():
    session['access_granted'] = True
    session['role'] = 'client'
    session['start_time'] = time.time()
    session['used_items'] = []
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/bienestar_final')
def bienestar_final():
    if not session.get('access_granted'):
        return redirect(url_for('index'))
    return render_template('bienestar_final.html')

@app.route('/api/get_event')
def get_event():
    # Control de tiempo: 10 minutos (600 segundos)
    elapsed = time.time() - session.get('start_time', time.time())
    if elapsed > 600:
        return jsonify({"redirect": "/bienestar_final"})

    lang = request.args.get('lang', 'en')
    almacen = cargar_almacen()
    item = random.choice(almacen['biblioteca']['triunfo_riqueza'] + almacen['biblioteca']['historias_largas_sabiduria'])
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "Eres KaMiZen. Voz masculina sabia. No IA. Sin listas."},
                  {"role": "user", "content": f"Idioma {lang}: {item['texto']}"}]
    )
    return jsonify({"contenido": response.choices[0].message.content})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=False)
