# UNFORMATTED DATA, NOT THE FINAL VERSION. For now, this should be good
# Duration of forecast should also matter

from pprint import pprint
import requests
import datetime

def weather_meteo(lat, lon, days=5, timezone="auto"):
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
            "precipitation"
            "cloud_cover",
            "surface_pressure",
            "relative_humidity_2m"
            ]),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": timezone
    }
    recall = requests.get(base, params=params)
    recall.raise_for_status()
    return recall.json()

if __name__ == "__main__":
    latitude, longtitude = 21.0278, 105.8342 #Swap this out later to fit with front end
    
    data = [weather_meteo(latitude, longtitude)]
    for x in data:
        pprint(x)
        print("\n")
