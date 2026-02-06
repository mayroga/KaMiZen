from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, uuid, random, datetime
import openai
import stripe
import psycopg2
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENV
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

openai.api_key = os.getenv("OPENAI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# DB
conn = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST")
)

# ---- HELPERS ----

def unique_seed():
    return str(uuid.uuid4()) + str(datetime.datetime.utcnow())

def weather_context():
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q=Miami&appid={WEATHER_API_KEY}"
        ).json()
        return r["weather"][0]["description"]
    except:
        return "clear"

# ---- AUTH ----

@app.post("/admin/login")
async def admin_login(data: dict):
    if data["username"] == ADMIN_USERNAME and data["password"] == ADMIN_PASSWORD:
        return {"status": "ok", "role": "admin"}
    raise HTTPException(status_code=403, detail="Unauthorized")

# ---- STRIPE ----

@app.post("/create-checkout-session")
async def create_checkout(data: dict):
    price = data["price"]
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": data["level"]},
                "unit_amount": int(price * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=data["success"],
        cancel_url=data["cancel"],
    )
    return {"url": session.url}

# ---- AI CORE ----

@app.post("/life/guide")
async def life_guide(data: dict):
    lang = data["lang"]
    age = data["age"]
    mood = data["mood"]
    level = data["level"]

    seed = unique_seed()
    weather = weather_context()

    system_prompt = f"""
You are La Vida Continúa, a masculine calm guide.
Language: {lang}.
Never repeat phrases.
You guide life as a map.
Focus on wellbeing, wealth mindset, emotional balance, power, calm.
No medical advice.
Weather: {weather}.
Age: {age}.
Level: {level}.
Seed: {seed}.
"""

    user_prompt = f"""
User feels {mood}.
Guide them through a life map with obstacles, routes and decisions.
Use story, action, movement.
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.95
    )

    return {
        "message": response.choices[0].message.content,
        "seed": seed
    }
