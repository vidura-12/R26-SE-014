import joblib
import numpy as np

# LOAD MODEL
model = joblib.load("models/xgboost_model.pkl")
encoder = joblib.load("models/label_encoder.pkl")

def predict_risk(ph, moisture, temp):

    data = np.array([[ph, moisture, temp]])

    prediction = model.predict(data)

    label = encoder.inverse_transform(prediction)

    return label[0]