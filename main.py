import os, json, random, time, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_prod_2026")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

# MAPA DEL MANUAL KAMIZEN (10 FASES ESTRATÉGICAS)
MANUAL_KAMIZEN = {
    1: {"fase": "Punto de Partida", "instruccion": "Pregunta la ubicación. El origen define la energía inicial."},
    2: {"fase": "Bienvenida Mística", "instruccion": "Conecta el origen del usuario con la riqueza universal."},
    3: {"fase": "Obstáculo Mental", "instruccion": "Presenta un desafío de ego o miedo para ser superado."},
    4: {"fase": "Juego de Lógica", "instruccion": "Adivinanza de poder. La respuesta correcta otorga claridad."},
    5: {"fase": "Historia de Riqueza", "instruccion": "Narrativa corta sobre abundancia material y espiritual."},
    6: {"fase": "Desafío de Astucia", "instruccion": "Dilema ético donde la sabiduría es la única salida."},
    7: {"fase": "Historia de Poder", "instruccion": "Relato sobre el dominio de la voluntad propia."},
    8: {"fase": "Decreto Biopsicosocial", "instruccion": "Afirmaciones de salud y equilibrio inmediato."},
    9: {"fase": "Bienestar Total", "instruccion": "Inmersión en relajación profunda y éxito visualizado."},
    10: {"fase": "Cierre y Trascendencia", "instruccion": "Sellado de la sesión. Invitación a la próxima ascensión."}
}

def consultar_ia_kamizen(fase_n, prompt_usuario, lang, origen):
    config = MANUAL_KAMIZEN.get(fase_n, MANUAL_KAMIZEN[10])
    contexto_manual = f"""
    Eres la encarnación del Manual KaMiZen. Fase actual: {fase_n} ({config['fase']}). 
    Instrucción: {config['instruccion']}. 
    Idioma: {lang}. Origen del usuario: {origen}.
    REGLA: Sé breve, profundo y con mucho peso. Usa palabras que eviten auditorías o autoridad legal.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": contexto_manual},
                {"role": "user", "content": prompt_usuario}
            ]
        )
        return response.choices[0].message.content
    except:
        return "La sabiduría fluye en el silencio."

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user, pw, lang = request.form.get("username"), request.form.get("password"), request.form.get("lang", "en")
    if user == ADMIN_USERNAME and pw == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'start_time': time.time(), 'lang': lang, 'origen': 'Desconocido'})
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/api/get_sequence")
def get_sequence():
    if not session.get('start_time'): return jsonify({"error": "No session"}), 401
    
    elapsed = (time.time() - session['start_time']) / 60
    fase_n = int(elapsed) + 1
    if fase_n > 10: fase_n = 10
    
    lang = session.get('lang', 'es')
    origen = session.get('origen')
    
    # Lógica de input y opciones según el manual
    input_req = True if fase_n == 1 and session.get('origen') == 'Desconocido' else False
    opciones = ["Opción Alfa", "Opción Beta", "Opción Gamma"] if fase_n in [4, 6] else None
    
    texto = consultar_ia_kamizen(fase_n, "Genera el mensaje de esta fase.", lang, origen)
    
    paisajes = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b",
        "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07"
    ]

    return jsonify({
        "fase": fase_n,
        "texto": texto,
        "bg": paisajes[fase_n % len(paisajes)],
        "input_requerido": input_req,
        "opciones": opciones,
        "finalizado": elapsed >= 10
    })

@app.route("/api/set_origen", methods=["POST"])
def set_origen():
    session['origen'] = request.json.get('origen', 'El Universo')
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
