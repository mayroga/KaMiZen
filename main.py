import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

FASES = [
    "punto_partida", "bienvenida_personal", "obstaculo_mental", "juego_logico", 
    "historia_riqueza", "desafio_astucia", "historia_poder", "decreto_salud", "bienestar_total", "cierre"
]

def generar_contenido_ia(prompt: str, lang: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Eres KaMiZen. Sabio y breve. Idioma: {lang}. Máximo 2 frases."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except:
        return "Respira profundamente."

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user, pw, lang = request.form.get("username"), request.form.get("password"), request.form.get("lang", "en")
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'start_time': time.time(), 'lang': lang, 'origen': None})
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('start_time'): return jsonify({"error": "No session"}), 401
    
    lang = session.get('lang', 'es')
    elapsed = (time.time() - session['start_time']) / 60
    fase_idx = min(int(elapsed), len(FASES)-1)
    fase_actual = FASES[fase_idx]

    paisajes = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b",
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
    ]
    
    texto, opciones, input_req = "", None, False

    if fase_actual == "punto_partida" and not session.get('origen'):
        texto = "¿Desde qué ciudad inicias tu ascenso?" if lang=="es" else "From which city do you start?"
        input_req = True
    elif "juego" in fase_actual or "desafio" in fase_actual:
        texto = generar_contenido_ia("Plantea una adivinanza mística corta.", lang)
        opciones = ["A", "B", "C"]
    else:
        texto = generar_contenido_ia(f"Mensaje de {fase_actual}.", lang)

    return jsonify({
        "texto": texto, 
        "bg": paisajes[fase_idx % len(paisajes)], 
        "opciones": opciones, 
        "input_requerido": input_req,
        "finalizado": elapsed >= 10,
        "fase_n": fase_idx
    })

@app.route("/api/set_origen", methods=["POST"])
def set_origen():
    session['origen'] = request.json.get('origen', 'El Mundo')
    return jsonify({"ok": True})

@app.route("/api/get_audio")
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

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
