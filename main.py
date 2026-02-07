from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, uuid, datetime, random, requests
import openai
import stripe

app = FastAPI()

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- ENV ----
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
openai.api_key = os.getenv("OPENAI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

# ---- SESSIONS ----
sessions = {}

# ---- HELPERS ----
def unique_seed():
    return str(uuid.uuid4()) + str(datetime.datetime.utcnow())

def get_weather(city):
    try:
        r = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric").json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

# ---- ADMIN AUTH ----
@app.post("/admin/login")
async def admin_login(data: dict):
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        return {"status": "ok", "role": "admin"}
    raise HTTPException(status_code=403, detail="Unauthorized")

# ---- STRIPE CHECKOUT ----
@app.post("/create-checkout-session")
async def create_checkout(data: dict):
    price = int(data["price"] * 100)
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": data["level"]},
                "unit_amount": price,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=data["success"],
        cancel_url=data["cancel"],
    )
    return {"url": session.url}

# ---- LIFE GUIDE AI ----
@app.post("/life/guide")
async def life_guide(data: dict):
    uid = str(uuid.uuid4())
    seed = unique_seed()
    weather = get_weather(data.get("city", "Miami"))
    
    sessions[uid] = {
        "age": data.get("age", 30),
        "lang": data.get("lang", "es"),
        "mood": data.get("mood", "neutral"),
        "level": data.get("level", "day"),
        "city": data.get("city", "Miami"),
        "weather": weather,
        "seed": seed,
        "start_time": datetime.datetime.utcnow().isoformat()
    }
    
    system_prompt = f"""
You are 'La Vida Continúa', a calm masculine guide.
Language: {data.get('lang', 'es')}
You never repeat phrases or stories.
Guide the user from their mood ({data.get('mood')}) to full wellbeing and abundance.
Focus on: wealth, power, calm, emotional balance, personal growth.
Weather: {weather}.
Seed: {seed}.
Age: {data.get('age', 30)}.
Level: {data.get('level', 'day')}.
"""

    user_prompt = f"""
Tell a welcoming story that ends in wealth, wellbeing, and abundance.
Include:
- Motivational story
- Micro-action
- Obstacle on life map
- Choice for user: remove / keep / go around
- Mini-game suggestion (math, riddle, puzzle)
- Three phrases to inspire
Keep experience immersive and premium.
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.95,
        max_tokens=400
    )

    sessions[uid]["message"] = response.choices[0].message.content

    return {"uid": uid, "message": sessions[uid]["message"]}
