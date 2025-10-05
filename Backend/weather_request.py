from pprint import pprint
import requests
import datetime

def weather_meteo(lat, lon, days=15, timezone="auto"):
    # Determine date range
    end_date = datetime.date.today() #today (UTC)
    start_date = end_date - datetime.timedelta(days=days)
    
    base = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join([
            "temperature_2m",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation",
            "cloud_cover",
            "surface_pressure",
            "relative_humidity_2m",
     ]),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": timezone
    }
    recall = requests.get(base, params=params)
    recall.raise_for_status()
    return recall.json()



    
