# ===============================
# KAMIZEN LIFE ENGINE - JSON STORY CORE v5.0
# BLOCK-DRIVEN SEQUENTIAL SYSTEM (NO REPEAT UNTIL END)
# ===============================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import uuid
import time

app = FastAPI()

# ===============================
# STATIC FILES
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = "kamizen.db"
CONTENT_PATH = "static/kamizen_content.json"

# ===============================
# LOAD JSON CONTENT
# ===============================
def load_content():
    if not os.path.exists(CONTENT_PATH):
        return {"sessions": []}

    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return {"sessions": []}

CONTENT = load_content()
STORIES = CONTENT.get("sessions", [])

# ===============================
# SESSION MEMORY
# ===============================
sessions = {}

# ===============================
# CREATE STATE
# ===============================
def create_state(profile):

    return {
        "mental": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": profile.get("age", 18),

        "story_index": 0,

        "psychology": {
            "stress": 0,
            "trauma": 0,
            "control": 50,
            "resilience": 50
        },

        "identity": {
            "core": "neutral"
        }
    }

# ===============================
# FIND STORY BY INDEX (NO REPEAT SYSTEM)
# ===============================
def get_story_by_index(index):
    if index >= len(STORIES):
        return None
    return STORIES[index]

# ===============================
# FLATTEN BLOCKS INTO TEXT (ORDERED)
# ===============================
def render_story(story, lang="es"):

    if not story:
        return None

    text_output = []

    for block in story.get("blocks", []):

        content = block.get("text", "")

        if isinstance(content, dict):
            text_output.append(content.get(lang, ""))
        else:
            text_output.append(str(content))

    return " ".join(text_output).strip()

# ===============================
# PSYCHOLOGY ENGINE
# ===============================
def update_psychology(state, decision):

    psy = state["psychology"]

    if decision == "TDM":
        psy["stress"] += 6
        psy["control"] -= 4

    elif decision in ["TDB", "TDP"]:
        psy["resilience"] += 4
        psy["control"] += 3

    elif decision == "TDN":
        psy["trauma"] += 3

    elif decision == "TDG":
        psy["control"] += 5
        psy["stress"] += 2

    elif decision == "TDK":
        psy["resilience"] += 3

    for k in psy:
        psy[k] = max(0, min(100, psy[k]))

    if psy["stress"] > 70:
        state["identity"]["core"] = "survival"
    elif psy["trauma"] > 60:
        state["identity"]["core"] = "fragmented"
    elif psy["resilience"] > 70:
        state["identity"]["core"] = "stable"
    else:
        state["identity"]["core"] = "neutral"

# ===============================
# HOME
# ===============================
@app.get("/")
def home():
    return FileResponse("static/session.html")

# ===============================
# START SESSION
# ===============================
@app.post("/start")
async def start(req: Request):

    data = await req.json()
    profile = data.get("profile", {})

    session_id = str(uuid.uuid4())

    state = create_state(profile)

    story = get_story_by_index(0)

    sessions[session_id] = state

    return {
        "session_id": session_id,
        "state": state,
        "story": story,
        "index": 0,
        "end": False
    }

# ===============================
# JUDGE ENGINE (NO REPEAT FLOW)
# ===============================
@app.post("/judge")
async def judge(req: Request):

    data = await req.json()

    session_id = data.get("session_id")
    decision = data.get("decision", "TDM")

    if session_id not in sessions:
        return JSONResponse({"error": "session expired"}, status_code=404)

    state = sessions[session_id]

    index = state["story_index"]

    # ===============================
    # IMPACT SYSTEM
    # ===============================
    effects = {
        "TDB": {"mental": 8, "discipline": 5, "karma": 2},
        "TDP": {"discipline": 6, "karma": 3},
        "TDM": {"mental": -10, "karma": -2},
        "TDN": {"social": 6, "karma": 1},
        "TDG": {"mental": 5, "discipline": 4},
        "TDK": {"social": 8, "karma": 2}
    }

    for k, v in effects.get(decision, {}).items():
        state[k] = max(0, min(100, state.get(k, 0) + v))

    # ===============================
    # PSYCHOLOGY UPDATE
    # ===============================
    update_psychology(state, decision)

    # ===============================
    # ADVANCE STORY (NO REPEAT)
    # ===============================
    next_index = index + 1
    next_story = get_story_by_index(next_index)

    # RESET ONLY WHEN FINISHED ALL
    if not next_story:
        state["story_index"] = 0  # reset loop only at end

        return {
            "state": state,
            "story": None,
            "end": True,
            "message": "FIN DEL CICLO HUMANO. TODOS LOS EVENTOS COMPLETADOS."
        }

    # update index
    state["story_index"] = next_index
    sessions[session_id] = state

    # render full text from blocks
    full_story = render_story(next_story, lang="es")

    return {
        "state": state,
        "story": {
            "id": next_story.get("id"),
            "level": next_story.get("level"),
            "category": next_story.get("category"),
            "text": full_story
        },
        "end": False
    }

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
