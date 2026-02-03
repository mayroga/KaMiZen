from datetime import datetime

def generate_daily_actions():
    now = datetime.now()
    # Acciones con peso existencial, no solo rutinas
    actions = [
        {"action": "Siente el aire entrando: Estás vivo hoy.", "scheduled_at": now.replace(hour=8)},
        {"action": "Agua para tus células: El flujo de la vida.", "scheduled_at": now.replace(hour=10)},
        {"action": "Momento de silencio: Escucha tu propio latido.", "scheduled_at": now.replace(hour=13)},
        {"action": "Mueve tu templo: El cuerpo necesita recordar su fuerza.", "scheduled_at": now.replace(hour=17)},
        {"action": "Suelta el control: El ciclo del día termina.", "scheduled_at": now.replace(hour=22)}
    ]
    return actions
