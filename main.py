# main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os, uuid, datetime, random, requests
import openai
import stripe

app = FastAPI(title="KaMiZen – La Vida Continúa")

# ========== CORS ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar a dominios permitidos si quieres seguridad
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== ENV VARIABLES ==========
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")
openai.api_key = os.getenv("OPENAI_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# ========== STATIC FILES ==========
app.mount("/static", StaticFiles(directory="static"), name="static")

# ========== TEMPORARY SESSIONS ==========
sessions = {}  # se guardan solo mientras dura la sesión de usuario

# ================= HELPERS =================
def unique_seed():
    """Genera un ID único para cada sesión"""
    return str(uuid.uuid4()) + str(datetime.datetime.utcnow().timestamp())

def get_weather(city: str = "Miami"):
    """Obtiene clima de la ciudad para ambientación"""
    try:
        r = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        ).json()
        desc = r['weather'][0]['description']
        temp = r['main']['temp']
        return f"{desc} {temp}°C"
    except:
        return "clear"

# ================= FRONTEND =================
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    path = os.path.join("templates", "index.html")
    if not os.path.exists(path):
        return HTMLResponse("<h1>Error: index.html no encontrado</h1>", status_code=404)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# ================= ADMIN LOGIN =================
@app.post("/admin/login")
async def admin_login(data: dict):
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        return {"status": "ok", "role": "admin"}
    raise HTTPException(status_code=403, detail="Unauthorized")

# ================= STRIPE CHECKOUT =================
@app.post("/create-checkout-session")
async def create_checkout(data: dict):
    price = int(data.get("price", 0) * 100)  # Stripe necesita cents
    level = data.get("level", "day")
    success_url = data.get("success", "/")
    cancel_url = data.get("cancel", "/")

    try:
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
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

# ================= AI LIFE GUIDE =================
@app.post("/life/guide")
async def life_guide(data: dict):
    """
    Genera sesión adaptativa de 10 minutos para KaMiZen
    """
    # Datos del usuario
    lang = data.get("lang", "es")
    age = data.get("age", "25")
    mood = data.get("mood", "neutral")
    level = data.get("level", "day")
    city = data.get("city", "Miami")

    # ID único
    seed = unique_seed()
    weather = get_weather(city)

    # Prompt del sistema
    system_prompt = f"""
You are 'La Vida Continúa', a calm masculine guide.
Language: {lang}.
Never repeat stories, phrases, or structures.
Guide the user through a visual life map with nodes of wealth, obstacles, microactions, mini-games.
Always end the session with wellbeing, abundance, and biosocial health.
Weather: {weather}.
Age: {age}.
Level: {level}.
Seed: {seed}.
"""

    # Prompt del usuario
    user_prompt = f"""
User mood: {mood}.
Create a 10-minute immersive session:
- Short story for ambition, always ending in success and wealth.
- Interactive life map: start point, obstacles, nodes of wealth (mansions, yachts, luxury cars).
- Choices: user can remove, keep, or bypass obstacles.
- Include mini-games: math, word, riddles, puzzles (show correct answers).
- Include microactions and actionable advice.
- Include adaptive environmental changes: day/night, sun/moon, colors, wind, rain.
- Prepare blocks: reading, voice, mini-game, map, obstacles, decisions, microactions.
- Return all text in structured JSON for frontend.
"""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.95,
            max_tokens=800
        )
        message = response.choices[0].message.content
    except Exception as e:
        message = f"Error generando contenido: {str(e)}"

    # Guardar sesión temporal
    sessions[seed] = {
        "lang": lang,
        "age": age,
        "mood": mood,
        "level": level,
        "city": city,
        "start_time": datetime.datetime.utcnow().isoformat()
    }

    return {
        "session_id": seed,
        "message": message
    }

# ================= HEALTH CHECK =================
@app.get("/health")
async def health_check():
    return {"status": "ok", "sessions_active": len(sessions)}

# ================= RUNNING INFO =================
print("KaMiZen backend iniciado. Esperando conexiones...")
