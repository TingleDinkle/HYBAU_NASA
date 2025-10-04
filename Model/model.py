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

    def check_stationary(self, data, d_val : int) -> int:
        """
        Returns d value for ARIMA order.

        Args:
            data (pandas DataFrame): whatever data we get
            d_val (int): used for recursion.
        """
        # data will be a DataFrame by pandas
        check = adfuller(data.dropna()) # dropna() to remove NaN values
        p_value = check[1]

        # 0.05 is our base
        if p_value <= 0.05:
            # return order d = 0 (already stationary)
            return d_val
        else: 
            # d = 1 (make stationary)
            return self.check_stationary(data, d_val + 1)
    

