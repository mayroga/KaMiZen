from flask import Flask, request, jsonify, render_template
import os, time, random, requests, hashlib
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

    user = f"""
Language: {lang}
Age: {age}
Profile: {profile}
Mode: {mode}
City: {city}
Weather: {weather}
Hour: {hour}

Generate:
- A short welcoming narration
- A symbolic mini-story (realistic but poetic)
- One concrete life action (small, doable now)
- One obstacle shown on the life map
- One choice: remove / keep / go around
- Text must feel premium, abundant, human
"""

    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.95,
        max_tokens=220
    )

    return r.choices[0].message.content.strip()

# ================== WEATHER ==================
def get_weather(city):
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        ).json()
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
            "profile": data["profile"]
        },
        "start": time.time()
    }
    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    text = life_engine(sessions[uid]["data"])
    pos = random.randint(5, 15)

    return jsonify({
        "text": text,
        "move": pos
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
