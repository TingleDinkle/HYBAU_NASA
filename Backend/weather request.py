# Data needs to be formatted. For now, this should be good
# Duration of forecast should also matter

import requests

def weather_mateo(lat, lon):
    base = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto",
        "forecast_days": 1
    }
    recall = requests.get(base, params=params)
    recall.raise_for_status()
    return recall.json()


def weather_google(api_key, lat, lon, days=5):
    base = "https://weather.googleapis.com/v1/forecast/days:lookup"
    params = {
        "key": api_key,
        "location.latitude": lat,
        "location.longitude": lon,
        "days": days
    }
    recall = requests.get(base, params=params)
    recall.raise_for_status()
    return recall.json()

key = "" #I FORGOT TO GET A KEY

if __name__ == "__main__":
    latitude, longtitude = 21.0278, 105.8342
    
    data = [weather_mateo(latitude, longtitude),
            weather_google(key, latitude, longtitude, 1)
            ]
    for x in data:
        print(x)
        print("\n")
