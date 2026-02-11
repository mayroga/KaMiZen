import os, time
from flask import Flask, render_template, request, redirect, session, jsonify
import openai

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

FASES = [
    "bienvenida",
    "historia_poder",
    "obstaculo",
    "juego_mental",
    "historia_riqueza",
    "reflexion",
    "historia_integracion",
    "cierre"
]

PAISAJES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"
]

def generar_texto(prompt, lang):
    try:
        r = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"You are KaMiZen. Calm, wise, symbolic, reassuring. Language: {lang}"
                },
                {"role": "user", "content": prompt}
            ]
        )
        texto = r.choices[0].message.content.strip()
        return texto if texto else "You are safe here."
    except:
        return "You are accompanied. Everything is in order."

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    if request.form["username"] == ADMIN_USERNAME and request.form["password"] == ADMIN_PASSWORD:
        session["start_time"] = time.time()
        session["lang"] = request.form.get("lang", "en")
        return redirect("/servicio")
    return redirect("/")

@app.route("/servicio")
def servicio():
    if "start_time" not in session:
        return redirect("/")
    return render_template("escenario_mapa.html", lang=session["lang"])

@app.route("/api/state")
def state():
    if "start_time" not in session:
        return jsonify({"error": "no-session"}), 401

    elapsed = (time.time() - session["start_time"]) / 60
    fase_idx = min(int(elapsed), len(FASES) - 1)
    fase = FASES[fase_idx]
    lang = session.get("lang", "en")

    texto = ""
    voz = False
    opciones = None

    if fase == "bienvenida":
        texto = generar_texto(
            "Welcome the user. Calm presence. Short, warm, human.",
            lang
        )
        voz = True

    elif fase == "historia_poder":
        texto = generar_texto(
            "Short symbolic story about inner power, dignity and self-worth.",
            lang
        )
        voz = True

    elif fase == "obstaculo":
        texto = generar_texto(
            "Present a soft obstacle as part of growth. No judgment.",
            lang
        )
        opciones = [
            {"texto": "Face it" if lang=="en" else "Enfrentarlo"},
            {"texto": "Let it pass" if lang=="en" else "Dejarlo pasar"}
        ]
        voz = True  # frase corta hablada → confianza

    elif fase == "juego_mental":
        texto = generar_texto(
            "Guide a mental exercise of abundance and calm luxury.",
            lang
        )
        voz = False

    elif fase == "historia_riqueza":
        texto = generar_texto(
            "Story about wealth as peace, freedom and capability.",
            lang
        )
        voz = True

    elif fase == "reflexion":
        texto = generar_texto(
            "Invite reflection with reassuring phrases, not silence.",
            lang
        )
        voz = False

    elif fase == "historia_integracion":
        texto = generar_texto(
            "Story of integration, calm success and continuity.",
            lang
        )
        voz = True

    elif fase == "cierre":
        texto = generar_texto(
            "Close the experience with calm, satisfaction and trust.",
            lang
        )
        voz = True

    return jsonify({
        "texto": texto,
        "voz": voz,
        "bg": PAISAJES[fase_idx % len(PAISAJES)],
        "final": elapsed >= 10,
        "opciones": opciones
    })

@app.route("/api/audio")
def audio():
    text = request.args.get("text", "").strip()
    if not text:
        return "", 204
    try:
        r = client.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",
            input=text
        )
        return r.content, 200, {"Content-Type": "audio/mpeg"}
    except:
        return "", 500

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
