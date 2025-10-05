import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.multioutput import MultiOutputRegressor
from xgboost import XGBRegressor
from Backend.weather_request import weather_meteo

"""
IMPORTANT REMINDER: TESTING != EXTRAPOLATING
The model may perform extremely well during testing,
but for forecasting, since we don't have the ground truth data of our inputs,
forecasts will always be hard to be accurate.
"""
class MRXGBoost: #Multi-output Regression eXtreme Gradient Boost (Forest)
    def __init__(self, n_lag: int = 24, time_feature=False) -> None:
        """

        :param n_lag: Number of lag as features for XGBoost.
                    This helps XGBoost learn temporal data encoded in features.
                    See technique: Lag for time series analysis
        :param time_feature: If true, time series features are included. This includes hour, dayofweek, sin of hour day etc.
                    Depends on the situation, it might help. This will NOT work if your df does not have a datetime index
        """
        self.is_time = time_feature
        self.n_lag: int = n_lag
        self.model = MultiOutputRegressor(
            XGBRegressor(
                objective='reg:squarederror',
                n_estimators=150,
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
        if time_feature:
            self.time_features: list = ['hour', 'day_of_week', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos']

    def __create_features(self, df: pd.DataFrame) -> pd.DataFrame:
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

        # Add time features
        if self.is_time:
            df['hour'] = df.index.hour
            df['day_of_week'] = df.index.dayofweek
            df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
            df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
            df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
            df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        return df

    def process_data(self, df: pd.DataFrame, train_perc: float = 0.8) -> None:
        """
        !! REQUIRED TO DO BEFORE FITTING, EVALUATING OR FORECASTING
        :param df: Input Dataframe. Format: MUST have a date_time index; each column is the name of features (co2, so2, etc.)
        :param train_perc: Specify how to split the data into train and test sets (for evaluation). Default is 0.8 or 80% for training set.
        :return: Nothing.
        """
        if (not isinstance(df.index, pd.DatetimeIndex)) and (self.is_time):
            self.is_time = False
            print("!! The given Dataframe does not have a datetime index. The time_feature option has been turned off. !!")

        target_cols = df.columns
        new_df = self.__create_features(df)
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
        if self.X_train is None or self.Y_train is None or self.X_test is None or self.Y_test is None:
            raise AttributeError("Use .process_data(), then .fit(), then .forecast()/.evaluate()")
        Y_pred = pd.DataFrame(self.model.predict(self.X_test), columns=list(self.Y_test.columns))
        Y_test_reset_index = self.Y_test.copy().reset_index(drop=True)
        squared_error = (Y_pred - Y_test_reset_index) ** 2
        rmse = np.sqrt(squared_error.mean())
        print(f"Root Mean Square Error:\n{rmse}") #Computes root mean squared error
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
        if self.X_train is None or self.Y_train is None or self.X_test is None or self.Y_test is None:
            raise AttributeError("Use .process_data(), then .fit(), then .forecast()/.evaluate()")
        full_targets = self.Y_test.copy()
        target_cols = full_targets.columns
        max_lag = max(self.lag_indices)
        last_val = full_targets.iloc[-max_lag:] # A DataFrame

        X_last = []
        # Rebuilding a lagged input
        for lag in self.lag_indices:
            X_last.extend(last_val.iloc[-lag].values)

        last_time = self.X.index[-1]
        try:
            freq = self.X.index.inferred_freq
            forecast_index = pd.date_range(start=last_time + pd.Timedelta(1, unit=freq[0]), periods=steps, freq=freq)
        except AttributeError:
            freq = None
            forecast_index = None
        X_last = np.array(X_last)
        curr_time = last_time

        forecasts = []

        for _ in range(steps):
            X_input = X_last
            if self.is_time:
                hour = curr_time.hour
                dow = curr_time.dayofweek
                hour_sin = np.sin(2 * np.pi * hour / 24)
                hour_cos = np.cos(2 * np.pi * hour / 24)
                dow_sin = np.sin(2 * np.pi * dow / 7)
                dow_cos = np.cos(2 * np.pi * dow / 7)

                X_input = np.concatenate([X_last, [hour, dow, hour_sin, hour_cos, dow_sin, dow_cos]])
                curr_time = curr_time + pd.Timedelta(1, unit=freq[0])
            y_next = self.model.predict(X_input.reshape(1, -1))
            forecasts.append(y_next[0])

            X_last = np.roll(X_last, -len(target_cols))
            X_last[-len(target_cols):] = y_next[0]
        if forecast_index is not None:
            return pd.DataFrame(forecasts, columns=target_cols, index=forecast_index)
        return pd.DataFrame(forecasts, columns=target_cols)


if __name__ == "__main__":
    # Test data: weather_request
    lat, lon = 21.0278, 105.8342
    data = weather_meteo(lat, lon, days=30)
    data = data['hourly']
    df = pd.DataFrame(data)
    df['time'] = pd.to_datetime(df['time'])
    #df.set_index('time', inplace=True)
    print(df.tail())

    # Try out the model
    model = MRXGBoost(n_lag=24, time_feature=True)
    model.process_data(df, train_perc=0.8)
    model.fit()
    model.evaluate(graph=True)
    forecast_df = model.forecast(steps=36)
    print(forecast_df)
