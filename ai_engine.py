# Motor simple para generar microacciones automáticas
from datetime import datetime, timedelta

def generate_daily_actions():
    now = datetime.now()
    actions = [
        {"action": "Beber agua", "scheduled_at": now.replace(hour=9, minute=0)},
        {"action": "Mini caminata", "scheduled_at": now.replace(hour=11, minute=0)},
        {"action": "Almuerzo saludable", "scheduled_at": now.replace(hour=13, minute=0)},
        {"action": "Hidratación", "scheduled_at": now.replace(hour=15, minute=0)},
        {"action": "Ejercicio ligero", "scheduled_at": now.replace(hour=18, minute=0)}
    ]
    return actions
