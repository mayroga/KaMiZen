import os, time, random
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
    "juego",
    "historia_riqueza",
    "silencio",
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

def ia(prompt, lang):
    try:
        r = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are KaMiZen. Calm, wise, minimal. Language: {lang}"},
                {"role": "user", "content": prompt}
            ]
        )
        return r.choices[0].message.content.strip()
    except:
        return prompt

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
        return jsonify({"error": "no session"}), 401

    elapsed = (time.time() - session["start_time"]) / 60
    fase_idx = min(int(elapsed), len(FASES) - 1)
    fase = FASES[fase_idx]
    lang = session.get("lang", "en")

    texto = ""
    voz = False
    opciones = None

    if fase == "bienvenida":
        texto = ia("Welcome the user. Calm presence. One or two sentences.", lang)
        voz = True

    elif fase == "historia_poder":
        texto = ia("Short symbolic story about dignity and inner power.", lang)
        voz = True

    elif fase == "obstaculo":
        texto = ia("Present a soft emotional obstacle and its meaning.", lang)
        opciones = [
            {"texto": "Face it" if lang=="en" else "Enfrentarlo"},
            {"texto": "Let it pass" if lang=="en" else "Dejarlo pasar"}
        ]

    elif fase == "juego":
        texto = ia("Invite to imagine abundance without desire or pressure.", lang)

    elif fase == "historia_riqueza":
        texto = ia("Story about wealth as freedom, peace and capability.", lang)
        voz = True

    elif fase == "silencio":
        texto = ""  # silencio real

    elif fase == "reflexion":
        texto = ia("Invite reflection toward inner satisfaction.", lang)

    elif fase == "historia_integracion":
        texto = ia("Story of wholeness, calm success and continuity.", lang)
        voz = True

    elif fase == "cierre":
        texto = ia("Close with peace, gratitude and completeness.", lang)
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
    text = request.args.get("text", "")
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
