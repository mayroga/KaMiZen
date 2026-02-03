import requests
import os

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_URL = "http://api.openweathermap.org/data/2.5/weather"

def get_weather(city: str):
    params = {"q": city, "appid": WEATHER_API_KEY, "units": "metric"}
    response = requests.get(WEATHER_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        return {
            "temp": data["main"]["temp"],
            "description": data["weather"][0]["description"]
        }
    return {"temp": None, "description": None}
