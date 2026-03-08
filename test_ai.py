import os
import httpx
import asyncio
import json

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

async def test_openai():
    prompt = "Genera un mini-desafío único en JSON: {'question':'...', 'answer':'...'}"
    headers = {"Authorization": f"Bearer {OPENAI_KEY}"}
    data = {
        "model": "gpt-4",
        "messages": [{"role":"user","content":prompt}],
        "temperature":0.8
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        print(r.text)

async def test_gemini():
    prompt = "Genera un mini-desafío único en JSON: {'question':'...', 'answer':'...'}"
    headers = {"Authorization": f"Bearer {GEMINI_KEY}"}
    data = {"prompt":prompt, "temperature":0.8}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post("https://gemini.api.url/generate", headers=headers, json=data)
        print(r.text)

async def main():
    if OPENAI_KEY:
        await test_openai()
    elif GEMINI_KEY:
        await test_gemini()
    else:
        print("No hay API key disponible")

asyncio.run(main())
