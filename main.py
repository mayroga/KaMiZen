from fastapi import FastAPI, Request, HTTPException, Form 
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import json5
from datetime import datetime, date, time
import pytz
import stripe

# ----------------------
# CONFIGURACIÓN
# ----------------------
STRIPE_SECRET_KEY = "TU_STRIPE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY = "TU_STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET = "TU_STRIPE_WEBHOOK_SECRET"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
SESSION_LIMIT = 600
PRICE_AMOUNT = 1099  # centavos

stripe.api_key = STRIPE_SECRET_KEY

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ----------------------
# CARGAR SESIONES
# ----------------------
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        db = json5.load(f)
except Exception as e:
    print("Error cargando JSON:", e)
    db = {"sesiones": []}

# ----------------------
# CONTROL DE USUARIOS POR SESIÓN
# ----------------------
session_users = {}

# ----------------------
# ZONA HORARIA
# ----------------------
MIAMI_TZ = pytz.timezone("America/New_York")

# ----------------------
# OBTENER SESIÓN ACTUAL
# ----------------------
def obtener_sesion_actual():
    if not db.get("sesiones"):
        return {"bloques":[]}, "normal"

    ahora = datetime.now(MIAMI_TZ)
    inicio = datetime(2026, 3, 9, 10, 0, tzinfo=MIAMI_TZ)
    dias_transcurridos = (ahora.date() - inicio.date()).days
    indice = dias_transcurridos % len(db["sesiones"])

    # Repetición a las 3pm
    if ahora.time() >= time(15,0):
        return db["sesiones"][indice], "repeticion"
    else:
        return db["sesiones"][indice], "normal"

# ----------------------
# RUTAS
# ----------------------
@app.get("/")
async def root():
    try:
        with open("static/session.html","r",encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando session.html: {e}</h1>")

@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return JSONResponse({"success":True})
    else:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrecta")

@app.get("/session_content")
async def session_content():
    sesion, tipo = obtener_sesion_actual()
    hoy = datetime.now(MIAMI_TZ).date()
    count = session_users.get(hoy.isoformat(),0)
    if count >= SESSION_LIMIT:
        raise HTTPException(status_code=429, detail="Límite de usuarios alcanzado")
    session_users[hoy.isoformat()] = count+1
    return {"sesion": sesion, "tipo": tipo, "stripe_publishable": STRIPE_PUBLISHABLE_KEY}

@app.post("/create_checkout_session")
async def create_checkout_session():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': 'Sesión KaMiZen Diaria'},
                    'unit_amount': PRICE_AMOUNT,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='https://kamizen.onrender.com/?success=true',
            cancel_url='https://kamizen.onrender.com/?canceled=true',
        )
        return JSONResponse({'id': checkout_session.id})
    except Exception as e:
        return JSONResponse({'error': str(e)})

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return JSONResponse({'status':'error','detail':str(e)},status_code=400)
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"Pago completado: {session['id']}")
    return JSONResponse({'status':'success'})

@app.get("/debug_sessions")
async def debug_sessions():
    total = len(db.get("sesiones",[]))
    ahora = datetime.now(MIAMI_TZ)
    dias_transcurridos = (ahora.date() - date(2026,3,9)).days
    indice = dias_transcurridos % total if total>0 else 0
    tipo = "repeticion" if ahora.time()>=time(15,0) else "normal"
    return {"total_sesiones":total,"dias_transcurridos":dias_transcurridos,"indice_hoy":indice,"tipo":tipo,"sesion_hoy":db["sesiones"][indice] if total>0 else {},"usuarios_hoy":session_users.get(ahora.date().isoformat(),0)}
