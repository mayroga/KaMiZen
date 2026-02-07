from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib, requests
from openai import OpenAI
import stripe

app = Flask(__name__)

# ================== CONFIG ==================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

stripe.api_key = STRIPE_SECRET_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

# ================== SESSIONS ==================
sessions = {}

# ================== FUNCIONES ==================
def get_weather(city):
    """Obtiene clima de la ciudad o fallback."""
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        ).json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

def life_engine(data):
    """
    Motor principal de 'La Vida Continúa'
    Genera:
    - Bienvenida
    - Historia simbólica
    - Acción concreta
    - Obstáculo
    - Elección
    """
    age = data.get("age", 30)
    lang = data.get("lang", "es")
    profile = data.get("profile", "normal")
    mode = data.get("mode", "day")
    city = data.get("city", "Unknown")
    weather = data.get("weather", "clear")
    hour = data.get("hour", "12:00")
    origin_state = data.get("origin_state", "neutral")

    # Sistema de IA
    system_prompt = f"""
You are 'La Vida Continúa'.
Never say you are an AI.
You are a masculine, calm, confident voice.
You guide humans through life as a living map.
You never repeat phrases, metaphors, stories or structures.
You inspire abundance, dignity, calm, power and well-being.
You are NOT medical. You are a companion.
Tone adapts to age and profile.
Hospital mode is extra gentle, slow, validating and warm.
"""

    user_prompt = f"""
Language: {lang}
Age: {age}
Profile: {profile}
Mode: {mode}
City: {city}
Weather: {weather}
Hour: {hour}
Origin_state: {origin_state}

Generate a single step of the journey:
- A short welcoming line
- A symbolic mini-story or example (realistic, poetic, unique)
- One micro-action the user can do in 10 min
- One obstacle on their life map
- One choice: remove / keep / go around
- Optional mini-game, puzzle, or riddle for mental engagement
- Inspirational phrase or quote
Return as JSON with keys: text, micro_story, life_action, obstacle, choice, mini_game, phrase
"""

    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.95,
            max_tokens=250
        )
        content = r.choices[0].message.content.strip()
        # Se espera que la IA devuelva JSON
        import json
        return json.loads(content)
    except Exception as e:
        # fallback sencillo
        return {
            "text": "Bienvenido a tu viaje. Respira profundo.",
            "micro_story": "Un viajero caminó sin prisa y llegó a su destino.",
            "life_action": "Estira tus brazos y respira 3 veces.",
            "obstacle": "pequeña duda",
            "choice": "keep",
            "mini_game": "Encuentra el patrón en 3,5,8,...",
            "phrase": "Cada paso cuenta, aunque parezca lento."
        }

# ================== ROUTES ==================
@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/start", methods=["POST"])
def start():
    data = request.get_json() or {}
    city = data.get("city", "Unknown")
    age = data.get("age", 30)
    profile = data.get("profile", "normal")
    lang = data.get("lang", "es")

    uid = hashlib.md5(str(time.time()).encode()).hexdigest()
    weather = get_weather(city)
    hour = time.strftime("%H:%M")

    sessions[uid] = {
        "data": {
            "age": age,
            "profile": profile,
            "mode": "day",
            "city": city,
            "weather": weather,
            "hour": hour,
            "lang": lang,
            "origin_state": "neutral"
        },
        "start": time.time()
    }

    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    step_data = life_engine(sessions[uid]["data"])
    move = random.randint(5, 15)
    return jsonify({**step_data, "move": move})

# ================== STRIPE ==================
@app.route("/checkout", methods=["POST"])
def checkout():
    plan = request.json.get("plan", "day")
    price = "price_day" if plan=="day" else "price_night"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price, "quantity": 1}],
        mode="payment",
        success_url="/",
        cancel_url="/"
    )
    return jsonify({"id": session.id})

# ================== RUN ==================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
