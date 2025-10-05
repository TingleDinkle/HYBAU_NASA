import datetime
import pandas as pd
import math
import openaq
import json


def clean_data(lat : float, lon : float):
    chem = {}

    client = openaq.OpenAQ("40c9b6c2e5e37bfbbf8fdf1497095554c7d7e9a0eeb61c5413695700ea9fee0f")
    locs = client.locations.list(coordinates=(lat, lon),
                                 radius=10000,)

    js_locs = json.loads(locs.json())

    for i in range(len(js_locs['results'])):
        value = client.locations.latest(locations_id=js_locs['results'][i]['id'])
        js_value = json.loads(value.json())
        
        if len(js_value['results']) > 4:
            #print(js_value['results'])
            #print("="*25)
            #print(js_locs['results'][i])
            for j in range(len(js_locs['results'][i]['sensors'])):
                sens_id = js_locs['results'][i]['sensors'][j]['id'] # j = 0 -> 7772103
                chem_name = js_locs['results'][i]['sensors'][j]['parameter']['name'] # j = 0 -> co

                for k in range(len(js_value['results'])):
                    if sens_id == js_value['results'][k]['sensorsId']: 
                        chem_value = js_value['results'][k]['value'] 
                        chem[chem_name] = chem_value
            return chem


