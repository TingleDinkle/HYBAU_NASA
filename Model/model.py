import numpy as np
import pandas as pd
import sklearn
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import arma_order_select_ic
from statsmodels.tsa.stattools import adfuller



class ARIMAModel:
    def __init__(self, data : pd.DataFrame):
        self.model = None
        self.result = None
        self.data = data

    def best_order(self, d_val=0, max_d=2) -> tuple:
        """
        :param data: pd.Series
        :param d_val: current differencing count
        :param max_d: maximum differencing (default = 2)
        :return: optimal d (0, 1, 2)
        """
        # data will be a DataFrame by pandas
        check = adfuller(self.data.dropna()) # dropna() to remove NaN values
        p_value = check[1]

        # 0.05 is our base
        if p_value <= 0.05 or d_val == max_d:
            # if stationary or reached max differencing
            order_result : dict = arma_order_select_ic(self.data.dropna(), ic='aic', trend='n')
            best_aic : list = order_result.aic_min_order

            best_p = best_aic[0]
            best_q = best_aic[1]
            return (best_p, d_val, best_q)
        
        else:
            # if not stationary:
            data_diff = self.data.diff().dropna()
            return self.check_stationary(data_diff, d_val + 1)
        
    def fit(self, data) -> None:
        self.model = ARIMA(data, order=self.best_order(data))
        self.result = self.model.fit()

    def forecast(self, steps : int = 10, ) -> np.ndarray | pd.DataFrame | pd.Series:
        forecast_array = self.result.forecast(steps=steps)
        return forecast_array