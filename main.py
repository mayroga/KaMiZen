import os, random, hashlib, datetime, json
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import stripe, requests

# ================== VARIABLES RENDER ==================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

stripe.api_key = STRIPE_SECRET_KEY

# ================== APP ==================
app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ================== REGISTRO DE MICROACCIONES ==================
microactions_db = {}  # {user_id: [acciones]}
users_db = {}         # {user_id: {"nivel":1/2, "preferencias":{}, "idioma":"es"}}

# ================== IA GENERATIVA ==================
def generate_landscape(context: str, mystery=False):
    seed = hashlib.sha256(f"{context}{random.random()}".encode()).hexdigest()
    prompt = f"""
    KaMiZen Landscape Generation
    Context: {context}
    Mood: calm, immersive, personal
    Dynamic elements: amanecer, atardecer, noche estrellada, lluvia, nieve, viento
    Effects: lumínicos variables, reflejos
    Include floating motivational phrases, 3D geometric shapes, color shifts based on microactions
    Unique seed: {seed}
    """
    if mystery:
        prompt += "Add a subtle mysterious presence hidden somewhere, changing daily, not scary but noticeable."

    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages":[{"role":"user","content":prompt}]
            },
            timeout=10
        )
        return r.json()["choices"][0]["message"]["content"]
    except:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
            json={"contents":[{"parts":[{"text":prompt}]}]},
            timeout=10
        )
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]

# ================== CONTEXTO DEL USUARIO ==================
def get_context(user_id: str):
    now = datetime.datetime.now()
    hour = now.hour
    weather_data = requests.get(
        f"http://api.openweathermap.org/data/2.5/weather?q=Miami&appid={WEATHER_API_KEY}&units=metric"
    ).json()
    temp = weather_data.get("main", {}).get("temp", 25)
    humidity = weather_data.get("main", {}).get("humidity", 50)
    wind = weather_data.get("wind", {}).get("speed", 0)
    
    return json.dumps({
        "datetime": str(now),
        "hour": hour,
        "temperature_C": temp,
        "humidity_percent": humidity,
        "wind_kmh": wind,
        "microactions": microactions_db.get(user_id, []),
        "user_preferences": users_db.get(user_id, {}).get("preferencias", {})
    })

# ================== ADMIN ==================
def is_admin(user: str, pwd: str):
    return user == ADMIN_USERNAME and pwd == ADMIN_PASSWORD

# ================== RUTAS ==================
@app.get("/", response_class=HTMLResponse)
def home(request: Request, pro: int = 0):
    user_id = request.client.host
    if user_id not in users_db:
        users_db[user_id] = {"nivel":1, "preferencias":{}, "idioma":"en"}
    if pro:
        users_db[user_id]["nivel"] = 2
    # Determinar si toca misterio diario (ej: primera visita del día)
    last_visit = users_db[user_id].get("last_visit")
    today = datetime.date.today().isoformat()
    mystery = False
    if last_visit != today:
        mystery = True
        users_db[user_id]["last_visit"] = today

    context = get_context(user_id)
    ai_landscape = generate_landscape(context, mystery=mystery)
    return templates.TemplateResponse("index.html", {
        "request": request,
        "ai_landscape": ai_landscape,
        "stripe_key": STRIPE_PUBLISHABLE_KEY,
        "nivel1_price": 169,
        "nivel2_price": 9900
    })

@app.post("/microaction")
def add_microaction(user_id: str = Form(...), action: str = Form(...)):
    now = datetime.datetime.now().isoformat()
    microactions_db.setdefault(user_id, []).append({"action": action, "timestamp": now})
    return {
        "status": "ok",
        "total": len(microactions_db[user_id]),
        "last_action": action,
        "timestamp": now
    }

@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if not is_admin(username, password):
        raise HTTPException(status_code=403)
    return {"status": "admin"}

@app.post("/create-checkout-session")
def create_checkout():
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "KaMiZen PRO"},
                "unit_amount": 9900,
                "recurring": {"interval": "month"}
            },
            "quantity": 1
        }],
        success_url="/?pro=1",
        cancel_url="/"
    )
    return {"id": session.id}

@app.get("/report")
def generate_report(user_id: str):
    actions = microactions_db.get(user_id, [])
    report = {
        "total_microacciones": len(actions),
        "acciones": actions[-20:],  # últimas 20
        "resumen": f"KaMiZen report for {user_id}"
    }
    return report
