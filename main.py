import os
import openai
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="KaMiZen NeuroAI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_api_key = os.getenv("OPENAI_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not openai_api_key and not gemini_api_key:
    raise Exception("Falta OPENAI_API_KEY y GEMINI_API_KEY.")

def call_openai(prompt):
    openai.api_key = openai_api_key
    response = openai.ChatCompletion.create(
        model="gpt-4.1",
        messages=[{"role":"system","content":"Eres un Especialista en KaMiZen, genera retos y historias sin repetir."},
                  {"role":"user","content":prompt}],
        max_tokens=400,
        temperature=0.85
    )
    return response.choices[0].message["content"]

def call_gemini(prompt):
    url = "https://gemini.googleapis.com/v1/models/text-bison-001:generateText"
    headers = {"X-Goog-Api-Key": gemini_api_key}
    body = {"prompt": prompt, "max_output_tokens": 400}
    with httpx.Client() as client:
        res = client.post(url, json=body, headers=headers, timeout=20)
    return res.json()["candidates"][0]["output"]

def generate_ai_content():
    prompt = """
    Crea UN solo reto para KaMiZen que combine:
    - Una historia corta de poder o bienestar,
    - UNA adivinanza o ejercicio mental,
    - Texto narrado (que se hará voz),
    - Respuesta correcta,
    Devuelve JSON EXACTO con:
    {
      "type":"historia"|"adivinanza"|"matematica",
      "question":"Texto de pregunta o historia",
      "answer":"Respuesta correcta",
      "narration":"Texto que será narrado por voz"
    }
    Sin marcar repetidos.
    """

    try:
        if openai_api_key:
            result = call_openai(prompt)
        else:
            result = call_gemini(prompt)
    except Exception:
        result = call_gemini(prompt)

    import json
    try:
        return json.loads(result.strip())
    except:
        raise HTTPException(status_code=500, detail="IA no devolvió JSON válido.")

@app.get("/api/next_challenge")
async def next_challenge():
    """
    Genera y devuelve un nuevo reto/historia con IA
    """
    data = generate_ai_content()
    return data
