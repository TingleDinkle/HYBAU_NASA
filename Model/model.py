import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import arma_order_select_ic
from statsmodels.tsa.stattools import adfuller



class ARIMAModel:
    def __init__(self, data : pd.DataFrame):
        self.model = None
        self.result = None
        self.data = data

    def best_order(self, data : pd.DataFrame, d_val : int = 0, max_d : int = 2) -> tuple:
        """
        :param data: pd.Series
        :param d_val: current differencing count
        :param max_d: maximum differencing (default = 2)
        :return: optimal d (0, 1, 2)
        """
        # data will be a DataFrame by pandas
        check = adfuller(data.dropna()) # dropna() to remove NaN values
        p_value = check[1]

        # 0.05 is our base
        if p_value <= 0.05 or d_val == max_d:
            # if stationary or reached max differencing
            # Auto create best orders for ARIMA
            order_result : dict = arma_order_select_ic(data.dropna(), ic='aic', trend='n')
            best_aic : list = order_result.aic_min_order

            best_p = best_aic[0]
            best_q = best_aic[1]
            return best_p, d_val, best_q
        
        else:
            # if not stationary:
            data_diff = data.diff().dropna()
            return self.best_order(data_diff, d_val + 1)
        
    def fit(self) -> None:
        """
        :param data: pd.DataFrame
        :return: Doesn't return anything but it sets result attribute to the fitted model
        """
        self.model = ARIMA(self.data, order=self.best_order(self.data))
        # method_kawrgs to increase maximum number of iterations (Resolve ConvergenceWarnings)
        self.result = self.model.fit(method_kwargs={'maxiter':300})

    def forecast(self, steps : int = 3, ) -> np.ndarray:
        """
        :param steps: number of steps to forecast (in this case, days)
        :return: np.ndarray of forecast obj.
        """
        forecast_obj = self.result.get_forecast(steps=steps)
        return forecast_obj