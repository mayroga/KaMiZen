from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib, requests
from openai import OpenAI
import stripe

app = Flask(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
stripe.api_key = STRIPE_SECRET_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

sessions = {}

def life_engine(data):
    system = f"""
You are 'La Vida Continúa'.
Never say you are an AI.
Guide humans through life as a living map.
Voice: masculine, calm, confident.
Tone adapts to age and profile.
Hospital mode: extra gentle, slow, validating, warm.
Always generate:
- Short human welcome
- Symbolic mini-story
- Micro-action real now
- Obstacles and choices for the map
- Text is abundant, premium, human
- Stories and phrases never repeat
- Two languages possible: Spanish and English
"""
    user = f"""
Age: {data['age']}
Profile: {data['profile']}
Mode: {data['mode']}
City: {data['city']}
Weather: {data['weather']}
Hour: {data['hour']}
Language: {data['lang']}

Origin: {data['origin_state']}

Generate:
- Text: human welcome
- Story: symbolic short story
- Action: micro-action for now
- Obstacle: value / habit / trait
- Mini-world: water, sun, city (if applies)
- Mini-game: optional mental puzzle
- Choice: remove / leave
"""
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role":"system","content":system},
            {"role":"user","content":user}
        ],
        temperature=0.95,
        max_tokens=300
    )
    return r.choices[0].message.content.strip()

def get_weather(city):
    try:
        r = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={os.getenv('WEATHER_API_KEY')}&units=metric").json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    uid = hashlib.md5(str(time.time()).encode()).hexdigest()
    weather = get_weather(data["city"])
    hour = time.strftime("%H:%M")
    sessions[uid] = {
        "data": {
            "age": data["age"],
            "profile": data["profile"],
            "mode": "day",
            "city": data["city"],
            "weather": weather,
            "hour": hour,
            "lang": data["lang"],
            "origin_state": "neutral"  # usuario define: eufórico, cansado, triste, etc.
        },
        "start": time.time()
    }
    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})
    text = life_engine(sessions[uid]["data"])
    pos = random.randint(5,15)
    obstacle = random.choice(["Perseverancia","Disciplina","Fe","Paciencia"])
    mini_world = random.sample(["agua","sol","ciudad"], random.randint(0,3))
    mini_game = random.choice([None,"Resuelve: 3+4*2=?","Encuentra la palabra escondida"])
    choice = True if random.random() > 0.5 else False

    return jsonify({
        "text": text,
        "move": pos,
        "obstacle": obstacle,
        "choice": choice,
        "mini_world": mini_world,
        "mini_game": mini_game,
        "story": "Historia corta inspiradora.",
        "action": "Micro acción que puedes hacer ahora."
    })

if __name__ == "__main__":
    app.run(debug=True)
