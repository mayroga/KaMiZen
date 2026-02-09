import os, json, random, time, stripe, openai
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Configuración Admin y Stripe
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kmz_2026_prod")

def cargar_almacen():
    with open('almacen_contenido.json', 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html', role=session.get('role', 'client'))

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('username') == ADMIN_USERNAME and request.form.get('password') == ADMIN_PASSWORD:
        session.update({'access_granted': True, 'role': 'admin', 'start_time': time.time()})
        return redirect(url_for('servicio'))
    return redirect(url_for('index'))

@app.route('/pago_exitoso')
def pago_exitoso():
    session.update({'access_granted': True, 'role': 'client', 'start_time': time.time(), 'used_items': []})
    return redirect(url_for('servicio'))

@app.route('/servicio')
def servicio():
    if not session.get('access_granted'): return redirect(url_for('index'))
    return render_template('escenario_mapa.html')

@app.route('/api/get_sequence')
def get_sequence():
    """Esta es la lógica que pediste: Ordenada por tiempo."""
    if not session.get('start_time'): return jsonify({"error": "No session"})
    
    elapsed = (time.time() - session['start_time']) / 60  # minutos
    almacen = cargar_almacen()
    lang = request.args.get('lang', 'es')
    
    # ETAPA 1: Inicio (Minuto 0-1) - Saludo y Bienvenida
    if elapsed < 1.5:
        tipo = "saludo"
        prompt = "Saluda al caminante. Pregúntale cómo se siente y en qué podemos acompañarlo hoy hacia su bienestar y riqueza interna."
    
    # ETAPA 2: El Camino (Minuto 1.5 - 8.5) - Historias, Obstáculos, Virtudes y Juegos
    elif elapsed < 8.5:
        etapas_vivas = ['historia', 'obstaculo', 'virtud', 'juego']
        tipo = random.choice(etapas_vivas)
        
        if tipo == 'historia':
            item = random.choice(almacen['biblioteca']['historias_largas_sabiduria'])
            prompt = f"Narra esta historia de éxito y riqueza: {item['texto']}"
        elif tipo == 'obstaculo':
            obs = random.choice(["la duda", "la prisa", "el miedo al dinero", "la envidia"])
            prompt = f"El caminante encuentra el obstáculo de {obs}. Explica qué pasa si lo enfrenta o si lo deja ahí. Dale el poder de decidir."
        elif tipo == 'virtud':
            vir = random.choice(["la disciplina", "la visión clara", "la gratitud"])
            prompt = f"El caminante abraza {vir}. Explica cómo esto lo lleva a la riqueza biopsicosocial."
        else:
            prompt = "Plantea un juego mental, adivinanza o reto matemático breve para fortalecer la mente."
            
    # ETAPA 3: Final (Minuto 8.5 - 10) - Autopropaganda y Cierre
    else:
        tipo = "final"
        prompt = "Estamos llegando al destino. Felicita al usuario. Menciona que el bienestar crece al compartirse e invita a traer a alguien más a KaMiZen."

    # Generación de Voz y Texto
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "Eres KaMiZen. Voz masculina, sabia, profesional. No digas que eres IA. Habla directo y con peso."},
                  {"role": "user", "content": f"Idioma {lang}: {prompt}"}]
    )
    texto = response.choices[0].message.content
    return jsonify({"tipo": tipo, "texto": texto, "finalizado": elapsed >= 10})

@app.route('/api/get_audio')
def get_audio():
    text = request.args.get('text', '')
    response = client.audio.speech.create(model="tts-1-hd", voice="onyx", input=text)
    return response.content, 200, {'Content-Type': 'audio/mpeg'}

if __name__ == '__main__':
    app.run(debug=False)
