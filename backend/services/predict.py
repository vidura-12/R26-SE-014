import joblib
import numpy as np

# LOAD MODEL
model   = joblib.load("models/xgboost_model.pkl")
encoder = joblib.load("models/label_encoder.pkl")

def predict_risk(ph, moisture, temp):

    data = np.array([[ph, moisture, temp]])

    prediction = model.predict(data)
    proba      = model.predict_proba(data)[0]  # ← added

    label      = encoder.inverse_transform(prediction)
    confidence = int(round(max(proba) * 100))  # ← added

    return {"level": label[0], "confidence": confidence}  # ← changed