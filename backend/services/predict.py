import joblib
import numpy as np

# LOAD MODEL & ENCODER (matches your actual filenames)
model   = joblib.load("models/xgboost_model.pkl")
encoder = joblib.load("models/label_encoder.pkl")

def predict_risk(ph, moisture, temp):
    """
    Predict WRR risk from 3 IoT sensor readings.
    Returns: {level, confidence, probabilities}
    """
    data = np.array([[ph, moisture, temp]])

    prediction = model.predict(data)
    proba      = model.predict_proba(data)[0]

    label      = encoder.inverse_transform(prediction)
    confidence = int(round(max(proba) * 100))

    # Full probability distribution
    probs = {
        encoder.classes_[i]: round(float(p), 3)
        for i, p in enumerate(proba)
    }

    return {
        "level": label[0],
        "confidence": confidence,
        "probabilities": probs
    }