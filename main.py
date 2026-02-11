import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

FASES = [
    "bienvenida", "obstaculos", "juego1", "historia1",
    "obstaculos2", "juego2", "historia2", "reflexion",
    "cierre", "autopropaganda"
]

OBSTACULOS_BASE = [
    {"nombre_es":"Perseverancia","nombre_en":"Perseverance"},
    {"nombre_es":"Ira","nombre_en":"Anger"},
    {"nombre_es":"Envidia","nombre_en":"Envy"},
    {"nombre_es":"Derrota","nombre_en":"Defeat"},
    {"nombre_es":"Astucia","nombre_en":"Cleverness"},
    {"nombre_es":"Inteligencia","nombre_en":"Intelligence"}
]

JUEGOS_BASE = [
    {"pregunta_es":"Resuelve el rompecabezas: ¿qué número sigue?", "pregunta_en":"Solve the puzzle: what number comes next?"},
    {"pregunta_es":"Adivina la palabra oculta", "pregunta_en":"Guess the hidden word"},
    {"pregunta_es":"Encuentra la lógica detrás de la secuencia", "pregunta_en":"Find the logic behind the sequence"}
]

PAISAJES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"
]

# Función para generar texto usando OpenAI
def generar_texto_ia(prompt: str, lang: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role":"system","content":f"Eres KaMiZen, sabio, breve, profundo, motivador, en idioma {lang}."},
                {"role":"user","content":prompt}
            ]
        )
        return response.choices[0].message.content
    except:
        # fallback elegante
        fallback_es = "Bienvenido a tu viaje interior. Prepárate para crecer y brillar."
        fallback_en = "Welcome to your inner journey. Get ready to grow and shine."
        return fallback_es if lang=="es" else fallback_en

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user = request.form.get("username")
    pw = request.form.get("password")
    lang = request.form.get("lang", "en")
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({
            'access_granted': True,
            'start_time': time.time(),
            'fase_idx':0,
            'lang':lang
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
        return jsonify({"error":"No session"}), 401

    elapsed = (time.time() - session['start_time']) / 60
    fase_idx = min(int(elapsed), len(FASES)-1)
    fase_actual = FASES[fase_idx]
    lang = session.get('lang', 'es')

    current_bg = PAISAJES[fase_idx % len(PAISAJES)]
    texto = ""
    opciones = None

    if fase_actual.startswith("bienvenida"):
        texto = generar_texto_ia("Saluda al usuario de forma mística y motivadora, iniciando su viaje interior.", lang)
    elif fase_actual.startswith("obstaculos"):
        obstaculo = random.choice(OBSTACULOS_BASE)
        nombre_obs = obstaculo["nombre_es"] if lang=="es" else obstaculo["nombre_en"]
        texto = generar_texto_ia(f"Aparece un obstáculo: {nombre_obs}. Explica brevemente qué pasa si lo supero o lo dejo.", lang)
        opciones = [
            {"texto":"Superarlo" if lang=="es" else "Overcome","valor":"superar"},
            {"texto":"Dejarlo" if lang=="es" else "Leave","valor":"dejar"}
        ]
    elif fase_actual.startswith("juego"):
        juego = random.choice(JUEGOS_BASE)
        pregunta = juego["pregunta_es"] if lang=="es" else juego["pregunta_en"]
        texto = generar_texto_ia(f"Genera un juego breve y divertido basado en: {pregunta}", lang)
        opciones = [
            {"texto":"A","valor":"A"},
            {"texto":"B","valor":"B"},
            {"texto":"C","valor":"C"}
        ]
    elif fase_actual.startswith("historia"):
        texto = generar_texto_ia("Cuenta una historia corta de riqueza, sabiduría y poder interior, max 20 segundos.", lang)
    elif fase_actual.startswith("reflexion"):
        texto = generar_texto_ia("Invita al usuario a reflexionar sobre lo aprendido y conectar con bienestar interior.", lang)
    elif fase_actual.startswith("cierre"):
        texto = generar_texto_ia("Finaliza el viaje con paz, riqueza y motivación para el futuro.", lang)
    elif fase_actual.startswith("autopropaganda"):
        texto = generar_texto_ia("Motiva al usuario a volver y seguir su crecimiento interior.", lang)

    return jsonify({"texto": texto, "opciones": opciones, "bg": current_bg, "finalizado": elapsed>=10})

@app.route("/api/get_audio")
def get_audio():
    text = request.args.get('text','')
    try:
        response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
        return response.content, 200, {'Content-Type':'audio/mpeg'}
    except:
        return "", 500

@app.route("/api/decision")
def decision():
    opcion = request.args.get("opcion","")
    lang = session.get("lang","es")
    feedback_prompt = f"Genera un feedback corto, sabio y motivador sobre la opción elegida: {opcion}, idioma {lang}."
    feedback = generar_texto_ia(feedback_prompt, lang)
    return jsonify({"ok":True, "feedback": feedback})

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
