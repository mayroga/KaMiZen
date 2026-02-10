import os, json, random, time, openai, stripe
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# =========================
# CONFIGURACIÓN BASE
# =========================
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", "")

def cargar_almacen():
    try:
        with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"biblioteca": {"historias": []}}

# =========================
# RUTAS DE ACCESO E IDIOMA
# =========================

@app.route("/")
def index():
    # No limpiamos toda la sesión para no perder el idioma
    if "idioma" not in session:
        session["idioma"] = "en"
    return render_template("index.html", 
                           role=session.get('role', 'client'), 
                           stripe_public_key=STRIPE_PUBLIC_KEY)

@app.route("/login", methods=["POST"])
def login():
    user = request.form.get("username")
    pw = request.form.get("password")
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({
            'access_granted': True, 
            'role': 'admin', 
            'start_time': time.time()
        })
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': 'KaMiZen Experience'},
                    'unit_amount': 499,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.host_url + 'pago_exitoso',
            cancel_url=request.host_url,
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route("/pago_exitoso")
def pago_exitoso():
    session.update({
        'access_granted': True, 
        'role': 'client', 
        'start_time': time.time()
    })
    return redirect(url_for("servicio"))

# =========================
# EXPERIENCIA KaMiZen
# =========================

@app.route("/servicio")
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for("index"))
    return render_template("escenario_mapa.html")

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('start_time'):
        return jsonify({"error": "No session active"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60
    idioma = request.args.get('lang', session.get('idioma', 'es'))
    
    # Lógica TVID (Estructura de 10 minutos)
    opciones = None
    if elapsed < 1:
        prompt = "Welcome the traveler. Ask how they feel in their soul today."
    elif elapsed < 5:
        prompt = "Share a short power riddle (adivinanza). Provide 3 options."
        opciones = ["A", "B", "C"] # La IA generará el contenido real
    elif elapsed < 9:
        prompt = "Narrate a story of internal wealth and victory."
    else:
        prompt = "Closing message. High biopsychosocial impact. Farewell."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are KaMiZen. Wise, professional. Language: {idioma}. Never say IA."},
                {"role": "user", "content": prompt}
            ]
        )
        return jsonify({
            "texto": response.choices[0].message.content,
            "opciones": opciones if elapsed > 1 and elapsed < 6 else None,
            "finalizado": elapsed >= 10
        })
    except:
        return jsonify({"texto": "..."})

@app.route("/api/get_audio")
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(port=10000)
