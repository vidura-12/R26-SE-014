from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# BASE DIRECTORY
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# MODEL FILE PATHS
# ============================================================

MODEL_PATH = BASE_DIR / "models" / "xgboost_model.pkl"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.pkl"
FEATURE_COLUMNS_PATH = BASE_DIR / "models" / "feature_columns.pkl"


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"XGBoost model not found: {MODEL_PATH}")

if not ENCODER_PATH.exists():
    raise FileNotFoundError(f"Label encoder not found: {ENCODER_PATH}")

if not FEATURE_COLUMNS_PATH.exists():
    raise FileNotFoundError(f"Feature columns file not found: {FEATURE_COLUMNS_PATH}")


# ============================================================
# LOAD MODEL, ENCODER, AND FEATURE COLUMNS
# ============================================================

model = joblib.load(MODEL_PATH)
encoder = joblib.load(ENCODER_PATH)
feature_cols = joblib.load(FEATURE_COLUMNS_PATH)


# ============================================================
# BUILD FULL FEATURE VECTOR (sensor-only: pH, moisture, temp)
# ============================================================

def build_full_features(ph, moisture, temp):
    """
    Build the feature vector required by the trained XGBoost model.

    The model is trained using ONLY features derivable from the three
    real IoT sensor readings — pH, soil moisture, and soil temperature.
    This must stay in exact sync with the feature engineering in
    train_model.py, or predictions will be wrong.
    """

    data = {
        "Soil_pH": ph,
        "Soil_Moisture_VWC_%": moisture,
        "Soil_Temp_C": temp,

        "Moisture_stress": (
            1 if (moisture < 22 or moisture > 38) else 0
        ),
        "Temp_stress": (
            1 if temp > 30 else 0
        ),
        "Combined_stress_score": (
            (1 if (moisture < 22 or moisture > 38) else 0)
            + (1 if temp > 30 else 0)
            + (1 if ph < 5.0 else 0)
        ),
    }

    df_temp = pd.DataFrame([data])

    # ── pH CATEGORY ──
    df_temp["pH_category"] = pd.cut(
        df_temp["Soil_pH"],
        bins=[0, 5.0, 6.5, 14],
        labels=["Acidic", "Optimal_pH", "Alkaline"],
    )

    df_temp = pd.get_dummies(df_temp, columns=["pH_category"])

    # ── ALIGN WITH TRAINING FEATURES ──
    for col in feature_cols:
        if col not in df_temp.columns:
            df_temp[col] = 0

    df_temp = df_temp[feature_cols]

    return df_temp


# ============================================================
# PREDICT RISK
# ============================================================

def predict_risk(ph, moisture, temp):
    """
    Predict White Root Rot risk from sensor readings.

    Parameters
    ----------
    ph : float
        Soil pH.
    moisture : float
        Soil moisture VWC percentage.
    temp : float
        Soil temperature in Celsius.

    Returns
    -------
    dict
        {
            "level": prediction label,
            "confidence": confidence percentage,
            "probabilities": probability for each class
        }
    """

    X = build_full_features(ph=ph, moisture=moisture, temp=temp)

    prediction = model.predict(X)
    proba = model.predict_proba(X)[0]
    label = encoder.inverse_transform(prediction)

    confidence = int(round(max(proba) * 100))

    probs = {
        encoder.classes_[i]: round(float(p), 3)
        for i, p in enumerate(proba)
    }

    return {
        "level": label[0],
        "confidence": confidence,
        "probabilities": probs,
    }