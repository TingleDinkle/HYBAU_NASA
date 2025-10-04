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

if __name__ == "__main__":
    latitude, longtitude = 21.0278, 105.8342 #Change this later to match with frontend
    data = weather_meteo(latitude, longtitude)

    print(data["hourly_units"]) #Every hour is an entry, which makes it 144 entries in total
    for x in ["temperature_2m",                       #temperature
              "wind_speed_10m", "wind_direction_10m", #wind
              "precipitation",                        #rain
              "cloud_cover",                          #clouds
              "surface_pressure",                     #pressure
              "relative_humidity_2m"]:                #humidity
        print(data["hourly"][x])
