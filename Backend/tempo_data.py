import requests
import numpy as np
import pandas as pd
import netCDF4
import earthaccess
import datetime, time


class TempoData:
    def __init__(self, account : str, password : str):
        self.account = account
        self.password = password
        self.login = earthaccess.login(persist=True)

    def search_data(self):
        tod = datetime.datetime.now()
        three_days_ago = datetime.timedelta(days=3)

        temp = tod - three_days_ago

        results = earthaccess.search_data(short_name="TEMPO_NO2_L3",
                                temporal=(temp, tod),
                                instrument="TEMPO",
                                count=100)
        
        return results

    def download_data(self, results : list):
        download = earthaccess.download(results, local_path="E:\VsCode\HYBAU_NASA\HYBAU_NASA\data")
        
        return download
    
    
    def extract_data(self, file : str, lat : float, lon : float):
        nc = netCDF4.Dataset(file, mode='r')
        print(nc.variables["time"][:])
        no2_vars = ['vertical_column_troposphere', 'nitrogen_dioxide', 
                       'tropospheric_vertical_column', 'NO2']
        lats = nc.variables['latitude'][:]
        lons = nc.variables['longitude'][:]
        
        # Find nearest grid point
        lat_diff = np.abs(lats - lat)
        lon_diff = np.abs(lons - lon)
        
        # For 2D arrays
        if len(lats.shape) == 2:
            dist = np.sqrt(lat_diff**2 + lon_diff**2)
            idx = np.unravel_index(np.argmin(dist), dist.shape)
            lat_idx, lon_idx = idx
        else:
            lat_idx = np.argmin(lat_diff)
            lon_idx = np.argmin(lon_diff)
        data = {
                'location': {
                    'requested_lat': lat,
                    'requested_lon': lon,
                    'actual_lat': float(lats[lat_idx] if len(lats.shape) == 1 
                                       else lats[lat_idx, lon_idx]),
                    'actual_lon': float(lons[lon_idx] if len(lons.shape) == 1 
                                       else lons[lat_idx, lon_idx])
                },
                'timestamp': nc.time_coverage_start if hasattr(nc, 'time_coverage_start') else None
            }
        for var_name in no2_vars:
                if var_name in nc.variables:
                    no2_data = nc.variables[var_name]
                    if len(no2_data.shape) == 2:
                        no2_value = no2_data[lat_idx, lon_idx]
                    elif len(no2_data.shape) == 3:
                        no2_value = no2_data[0, lat_idx, lon_idx]
                    else:
                        no2_value = no2_data[lat_idx]
                   
                    data['no2'] = {
                        'value': float(no2_value),
                        'unit': getattr(no2_data, 'units', 'molecules/cm^2'),
                        'long_name': getattr(no2_data, 'long_name', 'NO2 Column')
                    }
                    break
        if 'main_data_quality_flag' in nc.variables:
                quality = nc.variables['main_data_quality_flag']
                q_value = quality[lat_idx, lon_idx] if len(quality.shape) == 2 else quality[lat_idx]
                data['quality_flag'] = int(q_value)
        nc.close()
        return data

tempo = TempoData("humanstew", "MinhMemer081007@")
print(tempo.extract_data("E:\VsCode\HYBAU_NASA\HYBAU_NASA\data\TEMPO_NO2_L3_V04_20251001T162759Z_S007.nc", 38.427774, -475.738365))

