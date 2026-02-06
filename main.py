import os, random, hashlib, datetime, json, traceback
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import stripe
import requests

# ================== VARIABLES DE RENDER ==================
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

# ================== BASES DE DATOS SIMPLES ==================
microactions_db = {}  # {user_id: [acciones]}
users_db = {}         # {user_id: {"nivel":1/2, "preferencias":{}, "idioma":"es"}}

# ================== UTILIDADES ==================
def is_admin(user: str, pwd: str):
    return user == ADMIN_USERNAME and pwd == ADMIN_PASSWORD

def get_context(user_id: str):
    now = datetime.datetime.now()
    hour = now.hour

    # Clima
    try:
        weather_data = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather?q=Miami&appid={WEATHER_API_KEY}&units=metric"
        ).json()
        temp = weather_data.get("main", {}).get("temp", 25)
        humidity = weather_data.get("main", {}).get("humidity", 50)
        wind = weather_data.get("wind", {}).get("speed", 0)
    except:
        temp, humidity, wind = 25, 50, 0

    context = {
        "datetime": str(now),
        "hour": hour,
        "temp": temp,
        "humidity": humidity,
        "wind": wind,
        "user_preferences": users_db.get(user_id, {}).get("preferencias", {}),
        "user_microactions": microactions_db.get(user_id, [])
    }
    return json.dumps(context)

# ================== IA GENERATIVA ==================
def generate_ai_content(context: str):
    prompt = f"""
    KaMiZen Infinite Content
    Context: {context}
    Generate short phrases, micro-challenges, inspiring advice, mini-stories and tips.
    Output as JSON list of strings.
    """
    # Intentamos OpenAI
    try:
        import openai
        openai.api_key = OPENAI_API_KEY
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role":"user","content":prompt}],
            temperature=0.8,
            max_tokens=500
        )
        content = response["choices"][0]["message"]["content"]
        items = json.loads(content)
        if isinstance(items, list):
            return items
    except Exception as e:
        print("OpenAI failed:", e, traceback.format_exc())

    # Fallback Gemini
    try:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
            json={"contents":[{"parts":[{"text":prompt}]}]},
            timeout=10
        )
        content = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        items = json.loads(content)
        if isinstance(items, list):
            return items
    except Exception as e:
        print("Gemini failed:", e, traceback.format_exc())

    # Fallback local
    return [
        "Respira profundamente y siente el momento.",
        "Mini estiramiento recomendado.",
        "Observa tu entorno y agradece algo.",
        "Desafío: piensa en algo positivo que hayas hecho hoy.",
        "Historia breve: Una persona logró algo increíble solo con paciencia y foco.",
        "Consejo: Hidrátate y toma un momento de silencio.",
        "Frase motivadora: Cada día es una nueva oportunidad."
    ]

# ================== RUTAS ==================
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    user_id = request.client.host
    if user_id not in users_db:
        users_db[user_id] = {"nivel":1, "preferencias":{}, "idioma":"es"}
    context = get_context(user_id)
    # Generamos un primer paisaje como placeholder
    ai_landscape = "Bienvenido a KaMiZen. Tu experiencia se está preparando..."
    return templates.TemplateResponse("index.html", {
        "request": request,
        "ai_landscape": ai_landscape,
        "stripe_key": STRIPE_PUBLISHABLE_KEY
    })

@app.post("/microaction")
def add_microaction(user_id: str = Form(...), action: str = Form(...)):
    if user_id not in microactions_db:
        microactions_db[user_id] = []
    microactions_db[user_id].append({"action": action, "timestamp": str(datetime.datetime.now())})
    return {"status": "ok"}

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

# ================== ENDPOINT AI CONTENT ==================
@app.get("/ai-content")
def ai_content(user_id: str):
    context = get_context(user_id)
    items = generate_ai_content(context)
    return JSONResponse({"items": items})
