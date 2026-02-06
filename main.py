from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib, requests
from openai import OpenAI
import stripe

app = Flask(__name__)

# ================== CONFIG ==================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

stripe.api_key = STRIPE_SECRET_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

# ================== SESSION ==================
sessions = {}

# ================== NARRATIVE ENGINE ==================
def life_engine(data):
    age = data["age"]
    lang = data["lang"]
    mode = data["mode"]
    city = data["city"]
    weather = data["weather"]
    hour = data["hour"]
    profile = data["profile"]

    system = f"""
You are 'La Vida Continúa'. Masculine, calm, confident voice. Never say you are AI.
Guide humans through life as a living map.
Never repeat phrases, metaphors, stories or structures.
Inspire abundance, dignity, calm, power and well-being.
Not medical. Companion only.
Hospital mode: extra gentle, validating, slow.
"""

    user_prompt = f"""
Language: {lang}
Age: {age}
Profile: {profile}
Mode: {mode}
City: {city}
Weather: {weather}
Hour: {hour}

Generate:
- 1 short welcoming narration
- 1 mini-world description (water, city, forest, sun, stars)
- 1 symbolic micro-story (4 sentences max)
- 1 concrete life action (small, doable now)
- 1 obstacle for the map and a choice (remove/keep/shortcut)
- 1 mini-game prompt (math, puzzle, riddle)
- Text must feel premium, abundant, human
- No punctuation reading in voice, conversational
- Short pauses suggested (3-5s)
- Format as JSON:
{{
"narration": "...",
"mini_world": "...",
"micro_story": "...",
"life_action": "...",
"obstacle": "...",
"choice": "...",
"mini_game": "..."
}}
"""
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_prompt}],
        temperature=0.95,
        max_tokens=400
    )
    import json
    try:
        return json.loads(r.choices[0].message.content.strip())
    except:
        return {"narration": "Bienvenido a tu mapa de la vida", "mini_world": "", "micro_story": "", "life_action": "", "obstacle": "", "choice": "", "mini_game": ""}

# ================== WEATHER ==================
def get_weather(city):
    try:
        r = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric").json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

# ================== ROUTES ==================
@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    uid = hashlib.md5(str(time.time()).encode()).hexdigest()
    weather = get_weather(data["city"])
    hour = time.strftime("%H:%M")

    sessions[uid] = {
        "data": {
            "age": data["age"],
            "lang": data["lang"],
            "mode": data["mode"],
            "city": data["city"],
            "weather": weather,
            "hour": hour,
            "profile": data["profile"],
            "progress": 0,
            "mini_worlds": []
        },
        "start": time.time()
    }
    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    life_data = sessions[uid]["data"]
    response = life_engine(life_data)
    step_size = random.randint(5, 15)
    life_data["progress"] += step_size

    return jsonify({
        "text": response["narration"],
        "mini_world": response["mini_world"],
        "micro_story": response["micro_story"],
        "life_action": response["life_action"],
        "obstacle": response["obstacle"],
        "choice": response["choice"],
        "mini_game": response["mini_game"],
        "move": step_size
    })

# ================== STRIPE ==================
@app.route("/checkout", methods=["POST"])
def checkout():
    plan = request.json["plan"]
    price = "price_day" if plan == "day" else "price_night"
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price, "quantity": 1}],
        mode="payment",
        success_url="/",
        cancel_url="/"
    )
    return jsonify({"id": session.id})

if __name__ == "__main__":
    app.run()
