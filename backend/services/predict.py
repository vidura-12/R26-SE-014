import joblib
import numpy as np
import pandas as pd

# LOAD MODEL, ENCODER, and FEATURE COLUMNS
model = joblib.load("models/xgboost_model.pkl")
encoder = joblib.load("models/label_encoder.pkl")
feature_cols = joblib.load("models/feature_columns.pkl")  # Load expected columns

def build_full_features(ph, moisture, temp, rainfall=180, sunlight=7.5, 
                        age=8, growth_rate=3.5, bark_yield=275):
    """
    Build the full feature vector from sensor inputs + defaults.
    In production, pass all 8 values from your IoT sensors.
    """
    data = {
        'Soil_pH': ph,
        'Soil_Moisture_VWC_%': moisture,
        'Soil_Temp_C': temp,
        'Rainfall_mm_month': rainfall,
        'Sunlight_hrs_day': sunlight,
        'Plant_Age_years': age,
        'Growth_Rate_cm_month': growth_rate,
        'Annual_Bark_Yield_g_plant': bark_yield,
        'Moisture_stress': 1 if (moisture < 22 or moisture > 38) else 0,
        'Temp_stress': 1 if temp > 30 else 0,
        'Combined_stress_score': (1 if (moisture < 22 or moisture > 38) else 0) + 
                                  (1 if temp > 30 else 0) + 
                                  (1 if ph < 5.0 else 0),
        'Yield_per_age': bark_yield / age,
        'Growth_efficiency': growth_rate / age,
    }
    
    df_temp = pd.DataFrame([data])
    
    # Categorical dummies
    df_temp['pH_category'] = pd.cut(df_temp['Soil_pH'], bins=[0, 5.0, 6.5, 14], 
                                     labels=['Acidic', 'Optimal_pH', 'Alkaline'])
    df_temp['Rainfall_category'] = pd.cut(df_temp['Rainfall_mm_month'],
                                           bins=[0, 100, 200, 300, 500],
                                           labels=['Low', 'Medium', 'High', 'Very_High'])
    df_temp['Age_group'] = pd.cut(df_temp['Plant_Age_years'],
                                   bins=[0, 3, 8, 12, 20],
                                   labels=['Young', 'Mature', 'Old', 'Very_Old'])
    df_temp = pd.get_dummies(df_temp, columns=['pH_category', 'Rainfall_category', 'Age_group'])
    
    # Align with training columns
    for col in feature_cols:
        if col not in df_temp.columns:
            df_temp[col] = 0
            
    return df_temp[feature_cols]


def predict_risk(ph, moisture, temp, rainfall=180, sunlight=7.5, 
                 age=8, growth_rate=3.5, bark_yield=275):
    """
    Predict WRR risk from sensor readings.
    Returns: {level, confidence, probabilities}
    """
    X = build_full_features(ph, moisture, temp, rainfall, sunlight, age, growth_rate, bark_yield)
    
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
        "probabilities": probs
    }