import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import root_mean_squared_error
from xgboost import XGBRegressor
from Backend.weather_request import weather_meteo


class MRXGBoost: #Multi-output Regression eXtreme Gradient Boost (Forest)
    def __init__(self, n_lag: int = 24) -> None:
        """

        :param n_lag: Number of lag as features for XGBoost.
                    This helps XGBoost learn temporal data encoded in features.
                    See technique: Lag for time series analysis

        """
        self.n_lag: int = n_lag
        self.model = MultiOutputRegressor(
            XGBRegressor(
                objective='reg:squarederror',
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
            )
        )
        self.X = None
        self.Y = None
        self.X_train = None
        self.Y_train = None
        self.X_test = None
        self.Y_test = None
        self.lag_indices: list = []

    def __create_lag(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        This is a hidden function, aim to add lag to features so that xgboost can learn.
        :param df: The given Dataframe
        :return: A dataframe which has been encoded lagged features
        """
        lagged_cols = {}
        i = 0
        while 2 ** i <= self.n_lag:
            self.lag_indices.append(2 ** i)
            i += 1
        for col in df.columns:
            for lag in self.lag_indices:
                lagged_cols[f"{col}_lag{lag}"] = df[col].shift(lag)
        lagged_df = pd.DataFrame(lagged_cols)
        df = pd.concat([df, lagged_df], axis=1)
        df = df.dropna()
        return df

    def process_data(self, df: pd.DataFrame, train_perc: float = 0.8) -> None:
        """
        !! REQUIRED TO DO BEFORE FITTING, EVALUATING OR FORECASTING
        :param df: Input Dataframe. Format: MUST have a date_time index; each column is the name of features (co2, so2, etc.)
        :param train_perc: Specify how to split the data into train and test sets (for evaluation). Default is 0.8 or 80% for training set.
        :return: Nothing.
        """
        target_cols = df.columns
        new_df = self.__create_lag(df)
        self.Y = new_df[list(target_cols)] #Split into X and Y
        self.X = new_df.drop(columns=list(target_cols))

        index = int(len(self.X) * train_perc) #Index for slicing

        self.X_train, self.Y_train = self.X.iloc[:index], self.Y.iloc[:index] #Create X_train, Y_train (both are dfs)
        self.X_test, self.Y_test = self.X.iloc[index:], self.Y.iloc[index:] #Create X_test, Y_test (both are dfs)

    def fit(self) -> None:
        """
        Fits the model on the previously given dataframe (see self.process_data).
        :return: Nothing.
        """
        if self.X_train is None or self.Y_train is None or self.X_test is None or self.Y_test is None:
            raise AttributeError("Use .process_data(), then .fit(), then .forecast()/.evaluate()")
        self.model.fit(self.X_train, self.Y_train)

    def evaluate(self, graph: bool = False):
        """
        Evaluates the model on the test set to view accuracy. Currently metric is hard coded to be the Root Mean Squared Error idc.
        :param graph:
        :return: specify whether you want to see matplotlib plotting both the predictions and the actual test value (useful for evaluation)
        """
        Y_pred = pd.DataFrame(self.model.predict(self.X_test), columns=list(self.Y_test.columns))
        rmse = root_mean_squared_error(self.Y_test, Y_pred)
        print(f"Root Mean Square Error: {rmse}") #Computes root mean squared error

        #Computes graph
        if graph:
            fig, ax = plt.subplots(len(self.Y_test.columns), 1, figsize=(10, 12))
            for i, col in enumerate(self.Y_test.columns):
                ax[i].plot(np.array(self.Y_test[col]), label='y_real')
                ax[i].plot(np.array(Y_pred[col]), label='y_pred', linestyle='--')
                ax[i].set_title(col)
                ax[i].legend()
            plt.tight_layout()
            plt.show()

    def forecast(self, steps: int) -> pd.DataFrame:
        """
        This might need some more work but too tired rn, also I miss Reze.
        :param steps: How many steps you want to forercast.
        :return: A dataframe of your forecasts.
        """
        full_targets = self.Y_test.copy()
        target_cols = full_targets.columns
        max_lag = max(self.lag_indices)
        last_val = full_targets.iloc[-max_lag:]

        X_last = []
        for lag in self.lag_indices:
            X_last.extend(last_val.iloc[-lag].values)
        X_last = np.array(X_last)

        forecasts = []

        for _ in range(steps):
            y_next = self.model.predict(X_last.reshape(1, -1))
            forecasts.append(y_next[0])

            X_last = np.roll(X_last, -len(target_cols))
            X_last[-len(target_cols):] = y_next[0]
        last_time = self.X.index[-1]
        freq = self.X.index.inferred_freq
        forecast_index = pd.date_range(start=last_time + pd.Timedelta(1, unit=freq[0]), periods=steps, freq=freq)
        return pd.DataFrame(forecasts, columns=target_cols, index=forecast_index)


if __name__ == "__main__":
    # Test data: weather_request
    lat, lon = 21.0278, 105.8342
    data = weather_meteo(lat, lon, days=10)
    data = data['hourly']
    df = pd.DataFrame(data)
    df['time'] = pd.to_datetime(df['time'])
    df.set_index('time', inplace=True)
    print(df.tail())

    # Try out the model
    model = MRXGBoost(n_lag=24)
    model.process_data(df, train_perc=0.8)
    model.fit()
    model.evaluate(graph=True)
    print("PREDICTIONS:")
    print(model.forecast(30))
