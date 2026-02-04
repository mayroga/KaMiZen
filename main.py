import os, random, hashlib, datetime, requests
from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import stripe

# ================== ENV ==================
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

# ================== IA FALLBACK ==================
def generate_ai_prompt(context: str):
    seed = hashlib.sha256(f"{context}{random.random()}".encode()).hexdigest()
    prompt = f"""
    Ultra-realistic natural landscape.
    Context: {context}
    Mood: calm, immersive, personal
    No humans, no text.
    Unique seed: {seed}
    """
    # Try OpenAI
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=10
        )
        return r.json()["choices"][0]["message"]["content"]
    except:
        # Fallback Gemini
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
            json={"contents":[{"parts":[{"text":prompt}]}]},
            timeout=10
        )
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]

# ================== HELPERS ==================
def get_context(request: Request):
    now = datetime.datetime.now()
    hour = now.hour
    city = "Miami"
    weather = requests.get(
        f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
    ).json()
    temp = weather.get("main", {}).get("temp", 25)
    return f"{now} | hour:{hour} | temp:{temp}"

def is_admin(user: str, pwd: str):
    return user == ADMIN_USERNAME and pwd == ADMIN_PASSWORD

# ================== ROUTES ==================
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    context = get_context(request)
    ai_landscape = generate_ai_prompt(context)

    return templates.TemplateResponse("index.html", {
        "request": request,
        "ai_landscape": ai_landscape,
        "stripe_key": STRIPE_PUBLISHABLE_KEY
    })

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
