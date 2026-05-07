import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

from xgboost import XGBClassifier

# ================================
# LOAD DATASET
# ================================

df = pd.read_csv("../dataset/cinnamon_dataset.csv")

# ================================
# CREATE WHITE ROOT DISEASE LABELS
# ================================

def classify_risk(row):
    """
    Score-based WRR risk classification using only the 3 IoT sensor parameters.

    IMPORTANT — Moisture is measured in Volumetric Water Content (VWC%).
    This dataset's VWC range is 15–45%, where:
      - 26–31% VWC  = moderate moisture (above-average for cinnamon soil)
      - 31–36% VWC  = high moisture (approaches field capacity, favors fungus)
      - >36%   VWC  = very high moisture (ideal for WRR fungal growth)

    Source: FAO Irrigation & Drainage Paper 56 (VWC interpretation);
            Agrios (2005) for temperature range;
            Dept. of Export Agriculture Sri Lanka (2020) for pH range.
    """

    score = 0

    moisture = row['Soil_Moisture_VWC_%']
    temp = row['Soil_Temp_C']
    ph = row['Soil_pH']

    # ================================
    # SOIL MOISTURE CONDITION (VWC%)
    # WRR fungus thrives in wet soil.
    # Thresholds adapted to VWC scale.
    # ================================

    if moisture >= 36:
        score += 3   # Very wet — highest fungal risk
    elif moisture >= 31:
        score += 2   # Moderately wet — significant risk
    elif moisture >= 26:
        score += 1   # Above average — slight risk

    # ================================
    # TEMPERATURE CONDITION
    # Fungus grows best in 25–30°C
    # (Agrios, Plant Pathology, 2005)
    # ================================

    if 25 <= temp <= 30:
        score += 3   # Peak fungal growth zone
    elif (22 <= temp < 25) or (30 < temp <= 33):
        score += 1   # Suboptimal but still viable

    # ================================
    # SOIL PH CONDITION
    # WRR pathogens survive well in
    # slightly acidic soil (pH 5.0–6.5)
    # Source: Dept. Export Agriculture
    # ================================

    if 5.0 <= ph <= 6.5:
        score += 3   # Ideal for root pathogens
    elif (4.5 <= ph < 5.0) or (6.5 < ph <= 7.0):
        score += 1   # Borderline — lower risk

    # ================================
    # FINAL RISK CLASSIFICATION
    # Max possible score = 9
    # ================================

    if score >= 7:
        return "HIGH"
    elif score >= 4:
        return "MEDIUM"
    else:
        return "LOW"


# APPLY LABELS
df['White_Root_Risk'] = df.apply(classify_risk, axis=1)

# SHOW CLASS DISTRIBUTION
print("\n========= CLASS DISTRIBUTION =========")
print(df['White_Root_Risk'].value_counts())
print(df['White_Root_Risk'].value_counts(normalize=True).mul(100).round(1).astype(str) + '%')

# ================================
# FEATURES — only the 3 IoT params
# ================================

X = df[['Soil_pH', 'Soil_Moisture_VWC_%', 'Soil_Temp_C']]

# ================================
# TARGET
# ================================

y = df['White_Root_Risk']

# ================================
# ENCODE LABELS
# ================================

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

print("\nLabel encoding:", dict(zip(encoder.classes_, encoder.transform(encoder.classes_))))

# ================================
# TRAIN TEST SPLIT (stratified)
# ================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded      # ensures all 3 classes in both splits
)

# ================================
# TRAIN MODEL
# ================================

model = XGBClassifier(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.1,
    eval_metric='mlogloss',
    random_state=42
)

model.fit(X_train, y_train)

# ================================
# PREDICTIONS
# ================================

predictions = model.predict(X_test)

# ================================
# EVALUATION METRICS
# ================================

accuracy  = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average='weighted')
recall    = recall_score(y_test, predictions, average='weighted')
f1        = f1_score(y_test, predictions, average='weighted')

# ================================
# PRINT RESULTS
# ================================

print("\n========= MODEL EVALUATION =========")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

# ================================
# CLASSIFICATION REPORT
# ================================

print("\n========= CLASSIFICATION REPORT =========")
print(
    classification_report(
        y_test,
        predictions,
        target_names=encoder.classes_
    )
)

# ================================
# CONFUSION MATRIX
# ================================

cm = confusion_matrix(y_test, predictions)

plt.figure(figsize=(7, 6))

sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=encoder.classes_,
    yticklabels=encoder.classes_
)

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("White Root Disease Risk Confusion Matrix")
plt.tight_layout()
plt.savefig("../models/confusion_matrix.png")

print("\nConfusion matrix saved!")

# ================================
# QUICK SANITY CHECK PREDICTIONS
# ================================

print("\n========= SANITY CHECK =========")
test_cases = [
    (5.8, 38.0, 28.0, "Expected HIGH  — very wet + warm + acidic"),
    (5.9, 31.5, 27.0, "Expected HIGH  — moderately wet + ideal temp/pH"),
    (6.0, 28.0, 26.0, "Expected MEDIUM — average conditions"),
    (6.8, 22.0, 21.0, "Expected LOW   — dry + cool + alkaline"),
]
for ph, moist, temp, desc in test_cases:
    pred = encoder.inverse_transform(model.predict([[ph, moist, temp]]))[0]
    prob = model.predict_proba([[ph, moist, temp]])[0]
    conf = max(prob) * 100
    print(f"{desc}")
    print(f"  pH={ph}, moisture={moist}%, temp={temp}°C → {pred} ({conf:.1f}% confidence)")

# ================================
# SAVE MODEL & ENCODER
# ================================

joblib.dump(model,   "../models/xgboost_model.pkl")
joblib.dump(encoder, "../models/label_encoder.pkl")

print("\nModel and encoder saved successfully!")