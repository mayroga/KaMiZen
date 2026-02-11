import os, random, time
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
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

def ia_texto(prompt, lang):
    try:
        r = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are KaMiZen. Calm, wise, brief. Language: {lang}"},
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
        session["start"] = time.time()
        session["lang"] = request.form.get("lang", "en")
        return redirect("/servicio")
    return redirect("/")

@app.route("/servicio")
def servicio():
    if "start" not in session:
        return redirect("/")
    return render_template("escenario_mapa.html", lang=session["lang"])

@app.route("/api/state")
def state():
    elapsed = (time.time() - session["start"]) / 60
    fase = min(int(elapsed), len(FASES) - 1)
    lang = session.get("lang", "en")

    texto = ""
    voz = False
    opciones = None

    fase_actual = FASES[fase]

    if fase_actual == "bienvenida":
        texto = ia_texto("Welcome the user gently. Presence and calm.", lang)
        voz = True

    elif fase_actual == "historia_poder":
        texto = ia_texto("Short symbolic story about inner power and dignity.", lang)
        voz = True

    elif fase_actual == "obstaculo":
        texto = ia_texto("Present a soft obstacle and its emotional meaning.", lang)
        opciones = [
            {"texto": "Face it" if lang=="en" else "Enfrentarlo", "valor": "face"},
            {"texto": "Walk around" if lang=="en" else "Rodearlo", "valor": "avoid"}
        ]

    elif fase_actual == "juego_mental":
        texto = ia_texto("Invite to imagine luxury and abundance without desire or stress.", lang)

    elif fase_actual == "historia_riqueza":
        texto = ia_texto("Story about wealth as freedom, peace and capability.", lang)
        voz = True

    elif fase_actual == "silencio":
        texto = ""

    elif fase_actual == "reflexion":
        texto = ia_texto("Guide reflection toward inner satisfaction.", lang)

    elif fase_actual == "historia_integracion":
        texto = ia_texto("Story of integration, wholeness and calm success.", lang)
        voz = True

    elif fase_actual == "cierre":
        texto = ia_texto("Close the experience with peace and completeness.", lang)
        voz = True

    return jsonify({
        "texto": texto,
        "voz": voz,
        "bg": PAISAJES[fase % len(PAISAJES)],
        "final": elapsed >= 10,
        "opciones": opciones
    })

@app.route("/api/audio")
def audio():
    text = request.args.get("text", "")
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
