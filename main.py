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

# ================== SESSION ==================
sessions = {}

# ================== UTILIDADES ==================
def get_weather(city):
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        ).json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "despejado"

def generate_uid():
    return hashlib.md5(str(time.time()).encode()).hexdigest()

def life_engine_block(data, block_type):
    """
    block_type: 'welcome', 'story', 'inspiration', 'action', 'obstacle', 'game'
    """
    age = data["age"]
    lang = data["lang"]
    profile = data["profile"]
    state = data.get("origin_state", "neutral")
    city = data["city"]
    weather = data["weather"]
    hour = data["hour"]

    system_prompt = f"""
You are 'La Vida Continúa'.
Never say you are an AI.
You are masculine, calm, confident, human.
You guide humans through life as a living map.
Do not repeat stories, metaphors, or phrases.
Tone adapts to age, profile, block_type, and hour.
Hospital mode is extra gentle, validating, warm.
"""

    user_prompt = f"""
Block Type: {block_type}
Language: {lang}
Age: {age}
Profile: {profile}
State: {state}
City: {city}
Weather: {weather}
Hour: {hour}

Generate the following depending on block type:

- welcome: 1 short welcoming phrase
- story: 1 symbolic short story (realistic, poetic)
- inspiration: 2 short motivational phrases
- action: 1 micro-action (small, doable, real)
- obstacle: 1 obstacle and 1 choice (remove/keep/go around)
- game: 1 mental game, riddle, or math puzzle with hidden correct answer (do not show until user clicks button)

Ensure:
- Each output is unique per session
- Text is premium, abundant, human
- Spanish text in Spanish, English in English (according to lang)
- Short phrases, pauses, whispers if night, clear rhythm if day
- Do not mention AI or therapy
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.95,
        max_tokens=250
    )

    return response.choices[0].message.content.strip()

# ================== ROUTAS ==================
@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/start", methods=["POST"])
def start():
    data = request.get_json() or {}
    city = data.get("city", "Unknown")
    age = data.get("age", 0)
    profile = data.get("profile", "normal")
    lang = data.get("lang", "es")
    
    uid = generate_uid()
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
        "start": time.time(),
        "step_index": 0
    }

    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    session = sessions[uid]
    data = session["data"]
    step_index = session["step_index"]
    total_steps = 10  # 10 blocks = 10 minutes
    block_types = [
        "welcome",
        "story",
        "inspiration",
        "action",
        "obstacle",
        "story",
        "inspiration",
        "action",
        "game",
        "obstacle"
    ]
    block_type = block_types[step_index % total_steps]

    # Genera contenido
    content = life_engine_block(data, block_type)
    
    # Movimiento del mapa
    move = random.randint(5, 15)
    
    # Obstáculos visibles solo si block_type es 'obstacle'
    obstacle = block_type == "obstacle"
    
    # Mini-juegos visibles solo si block_type es 'game'
    mini_game = content if block_type == "game" else None
    
    # Actualiza índice para siguiente paso
    session["step_index"] += 1

    return jsonify({
        "text": content,
        "move": move,
        "obstacle": obstacle,
        "mini_game": mini_game
    })

# ================== STRIPE ==================
@app.route("/checkout", methods=["POST"])
def checkout():
    plan = request.json.get("plan", "day")
    price = "price_day" if plan == "day" else "price_night"

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
    app.run()
