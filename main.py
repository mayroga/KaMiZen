import os, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

# MANUAL KaMiZen - 10 FASES
MANUAL_KAMIZEN = {
    1: {"fase": "Punto de Partida", "detalle": "Exploración del origen geográfico y energético. El usuario establece su base."},
    2: {"fase": "Apertura de Conciencia", "detalle": "Bienvenida mística conectando el lugar de origen con el campo de infinitas posibilidades."},
    3: {"fase": "Desbloqueo de Obstáculos", "detalle": "Identificación de barreras mentales (ira, miedo, duda) y su transmutación en fuerza."},
    4: {"fase": "Geometría de la Lógica", "detalle": "Juego mental de alta complejidad donde la intuición y la razón deben unirse."},
    5: {"fase": "Arquitectura de la Riqueza", "detalle": "Narrativa sobre la abundancia que no se agota. El poder del pensamiento próspero."},
    6: {"fase": "Dilema del Poder Real", "detalle": "Desafío de astucia donde se pone a prueba la ética del futuro líder."},
    7: {"fase": "Sinfonía del Bienestar", "detalle": "Historia corta sobre el equilibrio biopsicosocial y la salud como activo supremo."},
    8: {"fase": "Decreto de Manifestación", "detalle": "Fase de afirmación poderosa. La palabra crea realidad inmediata."},
    9: {"fase": "Inmersión en el Éxito", "detalle": "Visualización guiada de metas cumplidas y riqueza material/espiritual alcanzada."},
    10: {"fase": "Trascendencia y Cierre", "detalle": "Sellado del viaje. El usuario se retira con bienestar total y claridad absoluta."}
}

def generar_contenido_manual(fase_n, lang, origen):
    config = MANUAL_KAMIZEN.get(fase_n)
    prompt = f"""
    Eres el Asesor Experto KaMiZen. EJECUTA LA FASE {fase_n}: {config['fase']}.
    Contexto: {config['detalle']}. Usuario viene de: {origen}.
    Idioma: {lang}. 
    REGLA: No seas repetitivo. Usa un lenguaje místico, profesional y motivador. 
    Evita palabras como IA o ChatGPT.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Manual KaMiZen Activo."}, {"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except:
        return "La riqueza te espera en el siguiente paso."

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user, pw, lang = request.form.get("username"), request.form.get("password"), request.form.get("lang", "en")
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'fase_actual': 1, 'lang': lang, 'origen': 'El Mundo'})
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('access_granted'):
        return jsonify({"error": "No session"}), 401

    fase_n = session.get('fase_actual', 1)
    lang = session.get('lang', 'es')
    origen = session.get('origen')

    # Paisajes según fase
    paisajes = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b",
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
        "https://images.unsplash.com/photo-1433838552652-f9a46b332c40",
        "https://images.unsplash.com/photo-1490730141103-6cac27aaab94"
    ]

    input_req = True if fase_n == 1 and origen == 'El Mundo' else False
    opciones = ["Elegir Sabiduría", "Elegir Poder", "Elegir Paz"] if fase_n in [4,6] else None

    texto = generar_contenido_manual(fase_n, lang, origen)

    finalizado = fase_n >= 10

    return jsonify({
        "fase": fase_n, "texto": texto, "bg": paisajes[fase_n - 1],
        "input_requerido": input_req, "opciones": opciones, "finalizado": finalizado
    })

@app.route("/api/set_origen", methods=["POST"])
def set_origen():
    session['origen'] = request.json.get('origen', 'El Universo')
    session['fase_actual'] = 2  # Avanza a siguiente fase
    return jsonify({"ok": True})

@app.route("/api/set_opcion", methods=["POST"])
def set_opcion():
    opcion = request.json.get('opcion', '')
    session['ultima_opcion'] = opcion
    session['fase_actual'] = session.get('fase_actual',1) + 1
    if session['fase_actual'] > 10:
        session['fase_actual'] = 10
    return jsonify({"ok": True})

@app.route("/api/get_audio")
def get_audio():
    text = request.args.get('text', '')
    try:
        response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
        return response.content, 200, {'Content-Type': 'audio/mpeg'}
    except:
        return '', 404

@app.route("/servicio")
def servicio():
    if not session.get('access_granted'): return redirect(url_for("index"))
    return render_template("escenario_mapa.html", lang=session.get('lang'))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
