from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib
from openai import OpenAI

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ===================== SESIONES =====================
sessions = {}

# ===================== MOTOR DE VIDA =====================
def life_engine(data):
    system = """
You are "La Vida Continúa".
You never say AI, therapy, medical, diagnosis.
You are a masculine, calm, confident human presence.
You generate STATES, not advice.
You validate desire: money, power, rest, pleasure, peace.
Short phrases. Pauses. Human warmth.
Never repeat metaphors or structures.
Never promise results.
"""

    user = f"""
Language: {data['lang']}
Age: {data['age']}
Profile: {data['profile']}
Energy: {data['energy']}
Moment: {data['moment']}
TimeAvailable: {data['duration']}
Context: {data['context']}

Generate a PURE JSON with:
welcome
validation
story
companion
action (30–60 seconds max)
map {{
  move (5-15),
  mini_world (array like agua, sol, ciudad, bosque),
  obstacle,
  choice (quitar / mantener / rodear)
}}
mini_game {{
  question,
  correct_answer (true/false),
  reveal
}}
voice_pace (slow or clear)
"""

    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role":"system","content":system},
            {"role":"user","content":user}
        ],
        temperature=0.95,
        max_tokens=400
    )

    return eval(r.choices[0].message.content)

# ===================== RUTAS =====================
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    uid = hashlib.md5(str(time.time()).encode()).hexdigest()

    sessions[uid] = {
        "data": {
            "age": data["age"],
            "lang": data["lang"],
            "profile": data["profile"],
            "energy": data.get("energy","media"),
            "context": data.get("context","vida"),
            "moment": data.get("moment","day"),
            "duration": data.get("duration",10)
        },
        "steps": 0,
        "max_steps": 6 if data.get("duration",10)==10 else 12
    }

    return jsonify({"uid": uid})

@app.route("/step/<uid>")
def step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    if sessions[uid]["steps"] >= sessions[uid]["max_steps"]:
        return jsonify({"end": True})

    sessions[uid]["steps"] += 1
    state = life_engine(sessions[uid]["data"])
    return jsonify(state)

if __name__ == "__main__":
    app.run()
