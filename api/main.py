from flask import Flask, send_file, make_response, request, render_template, abort, jsonify
from data_handler.air_request import air_meteo
from data_handler.weather_request import weather_meteo
from data_handler.tempo_data import TempoData
from model.model_MRXGBoost import MRXGBoost
import pandas as pd
import requests

app = Flask(__name__, static_folder='../static', template_folder='../templates')

@app.route("/")
def index():
    return render_template("index.html")


import reverse_geocoder as rg
import pycountry_convert as pc

def get_continent_from_coords(lat, lon):
    results = rg.search((lat, lon))  # Returns a list of dicts
    country_code = results[0]['cc']
    continent_code = pc.country_alpha2_to_continent_code(country_code)
    continent_name = pc.convert_continent_code_to_continent_name(continent_code)
    return continent_name


@app.route("/click/<float:lat>/<float:lng>")
def handle_click(lat, lng) -> tuple:
    # TODO: return the the JSON here. Like you use normal function and return str(something.json())

    air, weather = main_data(lat, lng)   
    pre_air, pre_wea = prediction(air, weather)

    
    return jsonify({'air_pollutant': air, 'weather': weather, 'prediction_air': pre_air, 'prediction_weather': pre_wea})

def main_data(lat : float, lng : float) -> tuple:
    """
    Call this every click
    :lat float: latitude
    :lng float: longitude
    :returns: tuple of json
    """
    air_quality = air_meteo(lat, lng, days=60) # .json
    weather = weather_meteo(lat, lng, days=60) # .json

    return air_quality, weather

def main_TEMPO_data(lat : float, lng : float) -> tuple:
    """
    Only call if clicked on USA region
    :lat float: latitude
    :lng float: longitude
    :returns: tuple of (no2, o3, hcho)
    """
    tempo_no2 : float = TempoData("NO2", lng, lat)
    tempo_o3 : float = TempoData("O3TOT", lng, lat)
    tempo_hcho : float = TempoData("HCHO", lng, lat)

    return tempo_no2, tempo_o3, tempo_hcho

def prediction(air, weather) -> tuple:
    """
    Runs XGBOOST model on DataFrame.
    :returns: Tuple of json (weather and air)
    """
    model_wea = MRXGBoost(n_lag=32, time_feature=True)
    data_wea = weather['hourly']
    df_wea = pd.DataFrame(data_wea)
    df_wea['time'] = pd.to_datetime(df_wea["time"])
    df_wea.set_index("time", inplace=True)
    model_wea.process_data(df_wea)
    model_wea.fit()
    model_wea.evaluate(graph=False)
    forecast_df_wea = model_wea.forecast(steps=72)

    model_air = MRXGBoost(n_lag=32, time_feature=True)
    data_air = air['hourly']
    df_air = pd.DataFrame(data_air)
    df_air['time'] = pd.to_datetime(df_air["time"])
    df_air.set_index("time", inplace=True)
    model_air.process_data(df_air)
    model_air.fit()
    model_air.evaluate(graph=False)
    forecast_df_air = model_air.forecast(steps=72)

    json_wea = forecast_df_wea.to_json()
    json_air = forecast_df_air.to_json()

    return json_air, json_wea

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True) #let FlaskK open a website with port 8080 - change based on the cloud or the user's server settings
