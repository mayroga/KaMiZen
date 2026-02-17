import os, time, openai, random
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD","kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME","admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD","kmz_2026_prod")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    user = request.form.get("username")
    pw = request.form.get("password")
    lang = request.form.get("lang","es")
    if user==ADMIN_USERNAME and pw==ADMIN_PASSWORD:
        session.update({'access_granted':True,'lang':lang,'historial':[],'start_time':time.time()})
        return redirect(url_for("servicio"))
    return redirect(url_for("index"))

@app.route("/servicio")
def servicio():
    if not session.get('access_granted'):
        return redirect(url_for("index"))
    return render_template("escenario_mapa.html", lang=session.get('lang'))

# Cada nodo decide acción y narrativa
@app.route("/api/node_action")
def node_action():
    tipo = request.args.get('tipo','riqueza')
    lang = session.get('lang','es')
    texto = ""
    opciones = None
    input_field = None

    if tipo=="obstaculo":
        texto="Un obstáculo aparece: miedo, duda o estrés. Respira profundo y decide cómo reaccionar."
        opciones=["Respirar","Pausar","Reflexionar"]
    else:
        frases = [
            "Has encontrado un nodo de riqueza: atención plena y gratitud.",
            "Nodo de bienestar físico: estira y siente tu cuerpo.",
            "Nodo de bienestar emocional: sonríe y respira profundo."
        ]
        texto=random.choice(frases)
        if random.random()<0.3:
            input_field="Escribe tu reflexión..."

    return jsonify({"texto":texto,"opciones":opciones,"input":input_field})

@app.route("/api/micro_action", methods=["POST"])
def micro_action():
    accion = request.json.get('accion','')
    session['historial'].append({'accion':accion,'time':time.time()})
    return jsonify({"ok":True})

@app.route("/api/get_audio")
def get_audio():
    text = request.args.get('text','')
    try:
        resp = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
        return resp.content, 200, {'Content-Type':'audio/mpeg'}
    except:
        return '',404

@app.route("/resumen")
def resumen():
    historial = session.get('historial',[])
    return f"<h1>Resumen del Viaje KaMiZen</h1><pre>{historial}</pre>"

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
