import os, random, time
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from openai import OpenAI

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "kamizen_ultra_2026")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

FASES = [
    "bienvenida",
    "obstaculo",
    "juego",
    "historia",
    "reflexion",
    "cierre"
]

PAISAJES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e"
]

FALLBACK_TEXT = {
    "es": "Respira. Todo avanza aunque no lo notes. Sigue caminando.",
    "en": "Breathe. Everything moves forward even if you cannot see it."
}

def ia_text(prompt, lang):
    try:
        r = client.responses.create(
            model="gpt-4.1-mini",
            input=f"Eres KaMiZen. Hablas siempre. Frases cortas, sabias, motivadoras. Idioma {lang}. {prompt}"
        )
        txt = r.output_text.strip()
        return txt if txt else FALLBACK_TEXT[lang]
    except:
        return FALLBACK_TEXT[lang]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    if request.form.get("username") == ADMIN_USERNAME and request.form.get("password") == ADMIN_PASSWORD:
        session["ok"] = True
        session["start"] = time.time()
        session["fase"] = 0
        session["lang"] = request.form.get("lang", "es")
        return redirect("/servicio")
    return redirect("/")

@app.route("/servicio")
def servicio():
    if not session.get("ok"):
        return redirect("/")
    return render_template("escenario_mapa.html", lang=session["lang"])

@app.route("/api/lang", methods=["POST"])
def cambiar_idioma():
    session["lang"] = request.json.get("lang", "es")
    return jsonify(ok=True)

@app.route("/api/skip")
def skip():
    session["fase"] = min(session.get("fase", 0) + 1, len(FASES) - 1)
    return jsonify(ok=True)

@app.route("/api/sequence")
def sequence():
    if not session.get("ok"):
        return jsonify(error=True)

    lang = session.get("lang", "es")
    fase = session.get("fase", 0)
    nombre_fase = FASES[fase]

    prompts = {
        "bienvenida": "Da la bienvenida al viajero.",
        "obstaculo": "Describe un obstáculo interior.",
        "juego": "Plantea un pequeño reto mental.",
        "historia": "Cuenta una micro historia de superación.",
        "reflexion": "Invita a reflexionar con calma.",
        "cierre": "Cierra el viaje con fuerza interior."
    }

    texto = ia_text(prompts[nombre_fase], lang)

    session["fase"] = min(fase + 1, len(FASES) - 1)

    return jsonify(
        texto=texto,
        bg=random.choice(PAISAJES),
        final=session["fase"] == len(FASES) - 1
    )

@app.route("/api/audio")
def audio():
    text = request.args.get("text", "")
    if not text:
        return "", 204

    try:
        audio = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="onyx",
            input=text
        )
        return audio.content, 200, {"Content-Type": "audio/mpeg"}
    except:
        return "", 204

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 10000)))
