from flask import Flask, request, jsonify, render_template
import os, time, random
from openai import OpenAI

app = Flask(__name__)

SESSION_TIME = 600
EXTRA_TIME = 600
OFFLINE_TIME = 1200

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
sessions = {}

# Definición de mini-mundos posibles
MINI_WORLDS = ["agua", "luz", "sol", "noche", "nubes", "montañas", "bosque", "ciudad", "playa", "estrellas"]

def generate_life_step(state, age, mode, lang, position):
    system = (
        "You are 'La Vida Continúa'. Never say you are AI. "
        "Guide the user through life with dynamic events, mini-worlds, obstacles, and choices. "
        "Provide actions, solutions, consequences, and adaptations to the user's state, age, mode, and position. "
        "Always aim for the user's well-being, joy, relaxation, growth, social and mental balance. "
        "Each step must be unique and never repeated."
    )
    mini_world = random.choice(MINI_WORLDS)
    user = (
        f"User age: {age}, state: {state}, position: {position}, mode: {mode}, language: {lang}. "
        f"Place the user in a mini-world: {mini_world}. "
        "Give a unique action, obstacle, resolution, or advice. Include options to remove, keep, or take an atajo (shortcut)."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.9,
        max_tokens=150
    )
    return response.choices[0].message.content.strip(), mini_world

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start():
    uid = request.remote_addr
    data = request.json

    sessions[uid] = {
        "start": time.time(),
        "lang": data.get("lang", "es"),
        "age": data.get("age", 30),
        "state": data.get("state", "presente"),
        "mode": data.get("mode", "personal"),
        "offline": data.get("offline", False),
        "destination": data.get("destination", "bienestar"),
        "position": 0,
        "extended": False
    }
    return jsonify({"ok": True})

@app.route("/step", methods=["GET"])
def step():
    uid = request.remote_addr
    s = sessions.get(uid)
    if not s:
        return jsonify({"end": True})

    elapsed = time.time() - s["start"]
    limit = OFFLINE_TIME if s["offline"] else SESSION_TIME + (EXTRA_TIME if s["extended"] else 0)
    if elapsed > limit:
        return jsonify({"end": True})

    message, mini_world = generate_life_step(s["state"], s["age"], s["mode"], s["lang"], s["position"])
    s["position"] += random.randint(10, 20)

    if int(elapsed // 60) >= 9 and not s["offline"]:
        s["extended"] = True

    return jsonify({
        "end": False,
        "minute": int(elapsed // 60),
        "message": message,
        "position": s["position"],
        "extended": s["extended"],
        "mini_world": mini_world
    })
