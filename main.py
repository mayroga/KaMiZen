import os, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD","kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME","admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD","kmz_2026_prod")

FASES=[
"bienvenida","microacciones","historia1","reto1","dualidad","silencio","historia2","cierre"
]

OBSTACULOS_BASE=[
{"nombre_es":"Perseverancia","nombre_en":"Perseverance"},
{"nombre_es":"Ira","nombre_en":"Anger"},
{"nombre_es":"Envidia","nombre_en":"Envy"},
{"nombre_es":"Derrota","nombre_en":"Defeat"},
{"nombre_es":"Astucia","nombre_en":"Cleverness"},
{"nombre_es":"Inteligencia","nombre_en":"Intelligence"}
]

JUEGOS_BASE=[
{"pregunta_es":"Resuelve el rompecabezas: ¿qué número sigue?", "pregunta_en":"Solve the puzzle: what number comes next?"},
{"pregunta_es":"Adivina la palabra oculta","pregunta_en":"Guess the hidden word"},
{"pregunta_es":"Encuentra la lógica detrás de la secuencia","pregunta_en":"Find the logic behind the sequence"}
]

@app.route("/")
def index(): return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user=request.form.get("username")
    pw=request.form.get("password")
    lang=request.form.get("lang","en")
    if user==ADMIN_USERNAME and pw==ADMIN_PASSWORD:
        session.update({'access_granted':True,'start_time':time.time(),'fase_idx':0,'lang':lang})
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/servicio")
def servicio():
    if not session.get('access_granted'): return redirect(url_for("index"))
    return render_template("escenario_mapa.html", lang=session.get('lang'))

def generar_texto_ia(prompt:str, lang:str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role":"system","content":f"Eres KaMiZen, sabio, breve, profundo, motivador, en idioma {lang}."},
                      {"role":"user","content":prompt}]
        )
        return response.choices[0].message.content
    except: return prompt

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('start_time'): return jsonify({"error":"No session"}),401
    elapsed=(time.time()-session['start_time'])/60
    lang=session.get('lang','es')
    fase_idx=min(int(elapsed*1.2), len(FASES)-1)
    fase_actual=FASES[fase_idx]

    paisajes=[
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b",
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"
    ]
    current_bg=paisajes[fase_idx % len(paisajes)]
    texto=""
    opciones=None

    if fase_actual=="bienvenida":
        texto=generar_texto_ia("Saluda al usuario y motívalo a iniciar su viaje interior, breve y simbólico.", lang)
    elif fase_actual=="microacciones":
        obst=random.choice(OBSTACULOS_BASE)
        nombre_obs=obst["nombre_es"] if lang=="es" else obst["nombre_en"]
        texto=generar_texto_ia(f"Aparece microacción: {nombre_obs}, breve motivación.", lang)
        opciones=[{"texto":"Avanzar" if lang=="es" else "Advance","valor":"avanzar"},
                 {"texto":"Reflexionar" if lang=="es" else "Reflect","valor":"reflexionar"}]
    elif fase_actual=="historia1":
        texto=generar_texto_ia("Cuenta historia corta de riqueza y poder simbólico, max 20s.", lang)
    elif fase_actual=="reto1":
        juego=random.choice(JUEGOS_BASE)
        pregunta=juego["pregunta_es"] if lang=="es" else juego["pregunta_en"]
        texto=generar_texto_ia(f"Genera juego mental basado en: {pregunta}", lang)
        opciones=[{"texto":"A","valor":"A"},{"texto":"B","valor":"B"},{"texto":"C","valor":"C"}]
    elif fase_actual=="dualidad":
        texto=generar_texto_ia("Muestra un obstáculo y su aprendizaje positivo, breve.", lang)
    elif fase_actual=="silencio":
        texto=" "  # silencio acompañado de música
    elif fase_actual=="historia2":
        texto=generar_texto_ia("Historia corta de integración y riqueza integral.", lang)
    elif fase_actual=="cierre":
        texto=generar_texto_ia("Cierre del viaje con sensación de completitud, motivación y abundancia.", lang)

    return jsonify({"texto":texto,"opciones":opciones,"bg":current_bg,"finalizado":elapsed>=10})

@app.route("/api/get_audio")
def get_audio():
    text=request.args.get('text','')
    try:
        response=client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
        return response.content,200,{'Content-Type':'audio/mpeg'}
    except: return "",500

@app.route("/api/decision")
def decision():
    opcion=request.args.get("opcion","")
    lang=session.get("lang","es")
    feedback_prompt=f"Genera feedback sabio, motivador y diverso sobre la opción elegida: {opcion} en idioma {lang}."
    feedback=generar_texto_ia(feedback_prompt, lang)
    return jsonify({"ok":True,"feedback":feedback})

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__=="__main__":
    app.run(host="0.0.0.0",port=int(os.environ.get("PORT",10000)))
