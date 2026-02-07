from flask import Flask, request, jsonify, render_template
import os, time, random, hashlib
from openai import OpenAI
import stripe

app = Flask(__name__)

# ================== CONFIG ==================
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# ================== SESSION STORE ==================
sessions = {}

# ================== CONTENT ENGINE ==================
def generate_block(context, block_type):
    system = """
You are 'La Vida Continúa'.
Never say you are an AI.
Masculine, calm, confident.
Not medical. Not therapy.
You guide, you don't judge.
Never repeat content.
"""

    prompts = {
        "welcome": "Give a short human welcome. Calm. Powerful.",
        "story": "Create a symbolic short story about life and direction.",
        "phrase": "Create a powerful inspirational phrase.",
        "game": "Create a simple mental puzzle with question and answer.",
        "obstacle": "Describe one life obstacle clearly.",
        "consequence": "Explain consequence of user's decision.",
        "action": "Give one simple micro-action doable now."
    }

    user = f"""
Language: {context['lang']}
Age: {context['age']}
Profile: {context['profile']}
State: {context['state']}
Goal: Well-being, success, abundance

Task: {prompts[block_type]}
"""

    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.95,
        max_tokens=160
    )

    return r.choices[0].message.content.strip()

# ================== ROUTES ==================
@app.route("/")
def index():
    return render_template("index.html", stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    uid = hashlib.md5(str(time.time()).encode()).hexdigest()

    sessions[uid] = {
        "context": {
            "age": data.get("age", 30),
            "lang": data.get("lang", "es"),
            "profile": data.get("profile", "normal"),
            "state": data.get("state", "neutral")
        },
        "step": 0,
        "start": time.time()
    }
    return jsonify({"uid": uid})

@app.route("/next/<uid>")
def next_step(uid):
    if uid not in sessions:
        return jsonify({"end": True})

    flow = [
        "welcome",
        "story",
        "phrase",
        "game",
        "obstacle",
        "consequence",
        "action"
    ]

    s = sessions[uid]
    if s["step"] >= len(flow):
        return jsonify({"end": True})

    block = flow[s["step"]]
    content = generate_block(s["context"], block)

    s["step"] += 1

    return jsonify({
        "type": block,
        "content": content
    })

# ================== STRIPE ==================
@app.route("/checkout", methods=["POST"])
def checkout():
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "KaMiZen – 10 min experiencia"},
                "unit_amount": 999
            },
            "quantity": 1
        }],
        mode="payment",
        success_url="/",
        cancel_url="/"
    )
    return jsonify({"id": session.id})

if __name__ == "__main__":
    app.run()
