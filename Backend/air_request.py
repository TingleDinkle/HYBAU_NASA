from pprint import pprint
import requests
import datetime

def air_meteo(lat, lon, days=15, timezone="auto"):
    # Determine date range
    end_date = datetime.date.today() #today (UTC)
    start_date = end_date - datetime.timedelta(days=days)
    
    base = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
	"hourly": ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": timezone
    }
    recall = requests.get(base, params=params)
    recall.raise_for_status()
    return recall.json()

if __name__ == "__main__":
#    latitude, longtitude = 21.0278, 105.8342 #Change this later to match with frontend
# To call: data = air_meteo(latitude, longtitude)
# To access: data["hourly"][x] where x is in
# ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]
"""
print(data["hourly_units"]) #Every hour is an entry, which makes it 144 entries in total
    for x in ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]:
        print(data["hourly"][x])
"""


    
