import numpy as np
import pandas as pd
import sklearn
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import arma_order_select_ic
from statsmodels.tsa.stattools import adfuller



class ARIMAModel:
    def __init__(self, order : tuple):
        self.order = order
        self.model = None
        self.result = None
        self.data = None

    def check_stationary(self, data, d_val=0, max_d=2) -> int:
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
            return d_val
        else:
            # if not stationary:
            data_diff = data.diff().dropna()
            return self.check_stationary(data_diff, d_val + 1)
    

