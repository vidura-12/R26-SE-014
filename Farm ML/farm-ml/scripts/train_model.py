import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import numpy as np
import os
import json
BASE_DIR = os.path.dirname(__file__)   # current folder (scripts)
file_path = os.path.join(BASE_DIR, "farm_ml_dataset.csv")

print("Loading from", file_path)

df = pd.read_csv(file_path) 
df["Date"] = pd.to_datetime(df["Date"])

print("Data loaded successfully")
print(df.head())

df = df.sort_values(["FarmId", "Date"]).reset_index(drop=True)

X = df.drop(columns=["FarmId", "FarmName", "Date", "Risk"])
y = df["Risk"]

print("Data Loaded")
print(f"Rows: {len(df)} | Features: {X.shape[1]}")

model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

tscv = TimeSeriesSplit(n_splits=3)

mae_scores = []
r2_scores  = []

print("\nTIME SERIES CROSS-VALIDATION")
print("=" * 50)

for fold, (train_index, test_index) in enumerate(tscv.split(X), start=1):
    
    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)

    mae_scores.append(mae)
    r2_scores.append(r2)

    print(f"\nFold {fold}")
    print(f"MAE : {mae:.2f}")
    print(f"R2  : {r2:.2f}")
    print("-" * 30)

print("\nFINAL RESULTS")
print("=" * 50)

print(f"Avg MAE: {np.mean(mae_scores):.2f}")
print(f"Avg R2 : {np.mean(r2_scores):.2f}")

print(f"MAE (error): {np.mean(mae_scores):.2f}")

model.fit(X, y)


with open("features.json", "w") as f:
    json.dump(list(X.columns), f)

model.save_model("xgboost_farm_model.json")

print("\nModel trained on full data and saved!")