from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import VitalCycle
from datetime import datetime

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/sensor_completo")
def sensor_completo(pasos: int = 0, vasos_agua: int = 0, db: Session = Depends(get_db)):
    if pasos < 1000:
        estado = "Fuego"
    elif vasos_agua >= 8:
        estado = "Equilibrio"
    else:
        estado = "Aire"

    data = {
        "hidratacion": f"{vasos_agua}/8",
        "movimiento": f"{pasos} pasos"
    }

    ciclo = VitalCycle(
        estado=estado,
        metricas=data
    )
    db.add(ciclo)
    db.commit()

    return {
        "estado_vital": estado,
        "descripcion": f"Estado {estado}",
        "metricas": data,
        "hora_local": datetime.now().strftime("%H:%M:%S")
    }
