from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib, requests
from openai import OpenAI
import stripe

app = Flask(__name__)

# ================= CONFIG =================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = "pk_live_51NqPxQBOA5mT4t0PEoRVRc0Sj7DugiHvxhozC3BYh0q0hAx1N3HCLJe4xEp3MSuNMA6mQ7fAO4mvtppqLodrtqEn00pgJNQaxz"

stripe.api_key = STRIPE_SECRET_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

# ================= SESIONES =================
sessions = {}

# ================= UTILIDADES =================
def get_weather(city):
    try:
        r = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric").json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

def life_engine(data):
    """Genera contenido dinámico, historias, frases y microacciones"""
    lang = data["lang"]
    profile = data["profile"]
    system = f"""
You are 'La Vida Continúa'.
Never say you are an AI.
Voice: masculine, calm, confident.
Adapt tone by profile ({profile}) and language ({lang}).
Provide:
1. Short welcoming phrase
2. Symbolic short story
3. One micro-action (small and doable)
4. One obstacle in the map
5. One choice (remove/keep/around)
6. One mini-game: puzzle, math problem, word game
All must be unique per session.
"""
    user = f"""
City: {data['city']}
Age: {data['age']}
Mode: {data['mode']}
Weather: {data['weather']}
Hour: {data['hour']}
Session duration: 10 minutes
"""
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.95,
        max_tokens=400
    )
    return r.choices[0].message.content.strip()

# ================= ROUTES =================
@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    # Acceso gratis para admin
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        uid = "admin_free"
    else:
        uid = hashlib.md5(str(time.time()).encode()).hexdigest()
    city = data.get("city", "Miami")
    age = data.get("age", 25)
    profile = data.get("profile", "normal")
    mode = data.get("mode", "day")
    lang = data.get("lang", "es")

    weather = get_weather(city)
    hour = time.strftime("%H:%M")

    sessions[uid] = {
        "data": {
            "city": city,
            "age": age,
            "profile": profile,
            "mode": mode,
            "lang": lang,
            "weather": weather,
            "hour": hour
        },
        "start_time": time.time()
    }
    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    text = life_engine(sessions[uid]["data"])
    pos = random.randint(50, 100)  # movimiento del mapa grande

    # Generación de mini-juego simple
    mini_game = {
        "question": "Resuelve: 5 + 7 = ?",
        "answer": "12"
    }

    return jsonify({
        "text": text,
        "move": pos,
        "mini_game": mini_game,
        "obstacle": random.choice(["perseverancia", "miedo", "duda"]),
        "choice": random.choice(["keep", "remove", "around"]),
        "micro_action": "Respira profundo y visualiza tu meta"
    })

# ================= STRIPE =================
@app.route("/checkout", methods=["POST"])
def checkout():
    plan = request.json.get("plan", "day")
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": "price_9_99", "quantity": 1}],
        mode="payment",
        success_url="/",
        cancel_url="/"
    )
    return jsonify({"id": session.id})

if __name__ == "__main__":
    app.run(debug=True)
