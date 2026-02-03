from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from . import database, crud, schemas, ai_engine, services
from fastapi.middleware.cors import CORSMiddleware

database.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@app.get("/microactions/{user_id}")
def get_actions(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_actions(db, user_id)

@app.post("/microactions/generate/{user_id}")
def generate_actions(user_id: int, db: Session = Depends(get_db)):
    actions = ai_engine.generate_daily_actions()
    created = []
    for a in actions:
        action_data = schemas.MicroActionCreate(
            user_id=user_id, action=a["action"], scheduled_at=a["scheduled_at"]
        )
        created.append(crud.create_microaction(db, action_data))
    return created

@app.get("/weather/{city}")
def weather(city: str):
    return services.get_weather(city)
