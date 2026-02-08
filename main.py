# main.py
import os, uuid, datetime, random, requests
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import openai
import stripe

app = FastAPI()

# =================== CORS ===================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar si quieres restringir dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================== ENV ===================
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
openai.api_key = os.getenv("OPENAI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# =================== STATIC FILES ===================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =================== SESSIONS TEMPORALES ===================
sessions = {}

def unique_seed():
    return str(uuid.uuid4()) + str(datetime.datetime.utcnow())

def get_weather(city: str = "Miami"):
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        ).json()
        return f"{r['weather'][0]['description']} {r['main']['temp']}°C"
    except:
        return "clear"

# =================== FRONTEND ===================
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    path = os.path.join("templates", "index.html")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# =================== LOGIN ===================
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        # Redirigir al Nivel 1
        return RedirectResponse(url="/level1", status_code=302)
    else:
        return HTMLResponse("<h2>Usuario o contraseña incorrectos</h2><a href='/'>Volver</a>")

# =================== NIVEL 1 ===================
@app.get("/level1", response_class=HTMLResponse)
async def level1():
    path = os.path.join("templates", "level1.html")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# =================== NIVEL 2 ===================
@app.get("/level2", response_class=HTMLResponse)
async def level2():
    path = os.path.join("templates", "level2.html")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# =================== STRIPE CHECKOUT ===================
@app.post("/create-checkout-session")
async def create_checkout(data: dict):
    price = int(data.get("price", 0) * 100)
    level = data.get("level", "day")
    success_url = data.get("success", "/level1")
    cancel_url = data.get("cancel", "/")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"KaMiZen - {level}"},
                "unit_amount": price,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return {"url": session.url}

# =================== AI LIFE GUIDE ===================
@app.post("/life/guide")
async def life_guide(data: dict):
    lang = data.get("lang", "en")
    age = data.get("age", "25")
    mood = data.get("mood", "neutral")
    level = data.get("level", "day")
    city = data.get("city", "Miami")

    seed = unique_seed()
    weather = get_weather(city)

    system_prompt = f"""
You are 'La Vida Continúa', calm masculine guide.
Language: {lang}.
Never repeat stories.
Guide user through life map with nodes, obstacles, microactions, mini-games.
End session with wellbeing, wealth and biopsychosocial health.
Weather: {weather}.
Age: {age}.
Level: {level}.
Seed: {seed}.
"""
    user_prompt = f"""
User mood: {mood}.
Create 10-minute immersive session:
- Short story for ambition, ending in success and wealth.
- Interactive life map: start point, obstacles, nodes of wealth.
- Choices: remove, keep or bypass obstacles.
- Include mini-games: math, word, puzzles (show correct answers).
- Include microactions and actionable advice.
- Return all text in JSON for frontend.
"""
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.95,
        max_tokens=500
    )
    message = response.choices[0].message.content

    sessions[seed] = {
        "lang": lang,
        "age": age,
        "mood": mood,
        "level": level,
        "city": city,
        "start_time": datetime.datetime.utcnow().isoformat()
    }
    return {"session_id": seed, "message": message}
