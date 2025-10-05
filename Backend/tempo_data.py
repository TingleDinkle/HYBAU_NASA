import numpy as np
import earthaccess
import datetime
import xarray as xa

class TempoData:
    def __init__(self, chem : str, lon : float, lat : float): 
        """
        Initiate login procedures, longitude and latitude (in that order)
        :param chem: Chemical to search for (NO2, O3TOT, HCHO)
        :param lon: Longitude of location
        :param lat: Latitude of location
        """
        self.chem = chem
        self.login = earthaccess.login(persist=True)
        self.lon = lon
        self.lat = lat

    def search_data(self) -> list:
        """
        Search for .nc files
        :param None
        :return: A List[DataGranules] of search results
        """
        # Get time range (16 hours ago from now)
        today : datetime = datetime.datetime.now()
        three_hours_ago : datetime = datetime.timedelta(hours=16)
        temp : datetime = today - three_hours_ago

        result : list = earthaccess.search_data(short_name=f"TEMPO_{self.chem}_L2",
                                temporal=(temp, today),
                                instrument="TEMPO",
                                point=(self.lon, self.lat), # order is (lon, lat)
                                count=1)
        return result

    def fetch_data(self, results : list):
        """
        Get the average of heatmap data and turn it into a float.
        :param results: A List[DataGranules] of search results
        :return: A float of the mean value of the chemical
        """
        # result[0] for products
        opn : xa.Dataset = earthaccess.open_virtual_dataset(results[0], group="product")
        
        # Conditions for different chemicals
        if self.chem == "NO2":
            chem = opn["vertical_column_troposphere"]  
        elif self.chem == "O3TOT":
            chem = opn["column_amount_o3"]
        elif self.chem == "HCHO":
            chem = opn["vertical_column"]
        # Cut out missing values as to not crash the data
        chem = chem.where(chem != -1e30)

        # Find mean value
        mean_chem = chem.mean().values

        # Numberlized
        num = np.format_float_scientific(mean_chem, precision=3)
        return num

if __name__ == "__main__":
    # Test data
    tempo = TempoData("NO2", -82.370971, 36.146747)
    no2 = tempo.fetch_data(tempo.search_data()) # 10/5 9.915e+14

    tempo = TempoData("O3TOT", -82.370971, 36.146747)
    o3 = tempo.fetch_data(tempo.search_data()) # 10/5 2.689e+02

    tempo = TempoData("HCHO", -82.370971, 36.146747)
    hcho = tempo.fetch_data(tempo.search_data()) # 10/5 8.281e+15

    print(no2, o3, hcho, end="\n")
