from fastapi import Request

# 🔥 MEMORIA DEL SISTEMA (puedes luego guardar en DB)
game_state = {
    "mental": 100,
    "social": 50,
    "money": 1000,
    "stress": 0,
    "karma": 0
}

@app.post("/judge")
async def judge(request: Request):
    data = await request.json()
    action = data.get("action")

    result = {
        "reaction": "",
        "effects": {},
        "emotion": ""
    }

    # =========================
    # 🧠 MOTOR DE JUICIO REAL
    # =========================

    if action == "avoid_conflict":
        game_state["social"] += 5
        game_state["stress"] -= 5
        result["reaction"] = "You avoided conflict. Safety increased."
        result["emotion"] = "calm"

    elif action == "face_conflict":
        game_state["stress"] += 10
        game_state["social"] += 10
        game_state["karma"] += 5
        result["reaction"] = "You faced the conflict. Growth achieved."
        result["emotion"] = "intense"

    elif action == "ignore":
        game_state["mental"] -= 10
        game_state["karma"] -= 5
        result["reaction"] = "You ignored the situation. Consequence delayed."
        result["emotion"] = "uncertain"

    elif action == "lie":
        game_state["social"] -= 15
        game_state["stress"] += 15
        result["reaction"] = "You lied. System instability detected."
        result["emotion"] = "danger"

    elif action == "truth":
        game_state["social"] += 10
        game_state["mental"] += 5
        result["reaction"] = "Truth accepted. Stability increased."
        result["emotion"] = "stable"

    # clamp values
    for k in game_state:
        game_state[k] = max(0, min(1000, game_state[k]))

    result["state"] = game_state

    return JSONResponse(result)
