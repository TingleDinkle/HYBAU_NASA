from pprint import pprint
import requests
import datetime

def air_meteo(lat : float, lon : float, days : int = 15, timezone : str ="auto") -> json:
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


    
