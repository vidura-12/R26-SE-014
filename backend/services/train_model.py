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
df = pd.read_csv("dataset/cinnamon_dataset.csv")

# ================================
# MAP REAL STRESS DATA TO WRR RISK ZONES
# ================================
# Stress_Classification is the REAL observed outcome from the field.
# We map it to WRR Risk Zones based on severity:
#   - Optimal / Near Optimal      → Low Risk      (healthy plants)
#   - Slight Deviation / Mild     → Medium Risk   (early warning)
#   - Moderate / High Stress      → High Risk     (intervention needed)
#   - Severe / Critical Stress    → Critical Risk (emergency)

stress_to_risk = {
    'Optimal':          'Low Risk',
    'Near Optimal':     'Low Risk',
    'Slight Deviation': 'Medium Risk',
    'Mild Stress':      'Medium Risk',
    'Moderate Stress':  'High Risk',
    'High Stress':      'High Risk',
    'Severe Stress':    'Critical Risk',
    'Critical Stress':  'Critical Risk'
}

df['White_Root_Risk'] = df['Stress_Classification'].map(stress_to_risk)

print("\n========= WRR RISK ZONE DISTRIBUTION =========")
print(df['White_Root_Risk'].value_counts())
print("\nPercentages:")
print(df['White_Root_Risk'].value_counts(normalize=True).mul(100).round(1).astype(str) + '%')

# ================================
# FEATURES — 3 IoT sensor parameters
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
    stratify=y_encoded
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

print("\n========= MODEL EVALUATION =========")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

# ================================
# CLASSIFICATION REPORT
# ================================
print("\n========= CLASSIFICATION REPORT =========")
print(classification_report(y_test, predictions, target_names=encoder.classes_))

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
plt.savefig("models/confusion_matrix.png")
print("\nConfusion matrix saved to models/confusion_matrix.png")

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
joblib.dump(model,   "models/xgboost_model.pkl")
joblib.dump(encoder, "models/label_encoder.pkl")

print("\nModel saved: models/xgboost_model.pkl")
print("Encoder saved: models/label_encoder.pkl")
print("Done!")