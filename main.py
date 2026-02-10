import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user = request.form.get("username")
    pw = request.form.get("password")
    lang = request.form.get("lang", "en") # Recibe el idioma del formulario
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({
            'access_granted': True,
            'start_time': time.time(),
            'lang': lang
        })
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/servicio")
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for("index"))
    return render_template("escenario_mapa.html", lang=session.get('lang'))

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('start_time'):
        return jsonify({"error": "No session"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60
    lang = session.get('lang', 'es')
    
    # Lista de paisajes que cambian cada minuto
    paisajes = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb", # Valle
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e", # Lago
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", # Bosque
        "https://images.unsplash.com/photo-1501854140801-50d01698950b", # Montaña
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"  # Cascada
    ]
    current_bg = paisajes[int(elapsed) % len(paisajes)]

    # Lógica de contenido breve
    opciones = None
    if elapsed < 1:
        p = "Saludo místico muy breve."
    elif 3 < elapsed < 5:
        p = "Plantea una adivinanza de poder corta con 3 opciones."
        opciones = ["A", "B", "C"] # La IA generará el texto real
    else:
        p = "Cuenta una enseñanza de riqueza de máximo 20 segundos."

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Eres KaMiZen. Sabio. Idioma: {lang}. Sé breve. Peso en cada palabra."},
                {"role": "user", "content": p}
            ]
        )
        return jsonify({
            "texto": response.choices[0].message.content,
            "opciones": opciones,
            "bg": current_bg,
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
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
