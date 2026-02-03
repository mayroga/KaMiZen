from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_microaction(db: Session, action: schemas.MicroActionCreate):
    db_action = models.MicroAction(
        user_id=action.user_id,
        action=action.action,
        scheduled_at=action.scheduled_at
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return db_action

def get_user_actions(db: Session, user_id: int):
    return db.query(models.MicroAction).filter(models.MicroAction.user_id == user_id).all()
