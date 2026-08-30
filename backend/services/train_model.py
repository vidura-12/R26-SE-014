from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, balanced_accuracy_score,
    cohen_kappa_score, precision_recall_fscore_support
)
from xgboost import XGBClassifier

# ============================================================
# BASE DIRECTORY (path-independent, same pattern as predict.py)
# train_model.py lives at: backend/services/train_model.py
# parent      = services/
# parent.parent = backend/
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = BASE_DIR / "dataset" / "cinnamon_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

# ================================
# 1. LOAD DATASET
# ================================
df = pd.read_csv(DATASET_PATH)

# ================================
# 2. MAP STRESS → WRR RISK ZONES
# ================================
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

print("=" * 60)
print("WRR RISK ZONE DISTRIBUTION")
print("=" * 60)
print(df['White_Root_Risk'].value_counts())
print("\nPercentages:")
print(df['White_Root_Risk'].value_counts(normalize=True).mul(100).round(1).astype(str) + '%')

# ================================
# 3. FEATURE ENGINEERING (SENSOR-ONLY: pH, Moisture, Temp)
# ================================
# NOTE: Rainfall, Sunlight, Age, Growth_Rate, Bark_Yield are DELIBERATELY
# excluded. The deployed API only ever receives pH, moisture, and temp
# from IoT sensors, so training must use only features derivable from
# those three values. This keeps train/inference features consistent.
# ================================

df['Moisture_stress'] = np.where(
    (df['Soil_Moisture_VWC_%'] < 22) | (df['Soil_Moisture_VWC_%'] > 38), 1, 0
)
df['Temp_stress'] = np.where(df['Soil_Temp_C'] > 30, 1, 0)
df['Combined_stress_score'] = (
    df['Moisture_stress'] +
    df['Temp_stress'] +
    np.where(df['Soil_pH'] < 5.0, 1, 0)
)

df['pH_category'] = pd.cut(
    df['Soil_pH'], bins=[0, 5.0, 6.5, 14],
    labels=['Acidic', 'Optimal_pH', 'Alkaline']
)

df_encoded = pd.get_dummies(df, columns=['pH_category'], drop_first=False)

# ================================
# 4. SELECT FEATURES — SENSOR-ONLY
# ================================
feature_cols = [
    'Soil_pH',
    'Soil_Moisture_VWC_%',
    'Soil_Temp_C',
    'Moisture_stress',
    'Temp_stress',
    'Combined_stress_score',
    'pH_category_Acidic',
    'pH_category_Optimal_pH',
    'pH_category_Alkaline',
]

# Ensure all expected dummy columns exist even if a category
# happens to be missing from this dataset
for col in feature_cols:
    if col not in df_encoded.columns:
        df_encoded[col] = 0

X = df_encoded[feature_cols]
y = df_encoded['White_Root_Risk']

print(f"\nUsing {len(feature_cols)} features: {feature_cols}")

# ================================
# 5. ENCODE LABELS
# ================================
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
print("\nLabel encoding:", dict(zip(encoder.classes_, encoder.transform(encoder.classes_))))

# ================================
# 6. TRAIN-TEST SPLIT
# ================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# ================================
# 7. HANDLE CLASS IMBALANCE
# ================================
classes = np.unique(y_train)
class_weights = compute_class_weight('balanced', classes=classes, y=y_train)
class_weight_dict = {i: w for i, w in enumerate(class_weights)}
sample_weights = np.array([class_weight_dict[y] for y in y_train])

print("\nClass weights:", dict(zip(encoder.classes_, class_weights.round(2))))

# ================================
# 8. TRAIN XGBOOST
# ================================
model = XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    min_child_weight=2,
    gamma=0.05,
    reg_alpha=0.05,
    reg_lambda=0.8,
    eval_metric='mlogloss',
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train, sample_weight=sample_weights)

# ================================
# 9. PREDICTIONS
# ================================
predictions = model.predict(X_test)
probas = model.predict_proba(X_test)

# ================================
# 10. MODEL PERFORMANCE METRICS
# ================================
acc      = accuracy_score(y_test, predictions)
prec_w   = precision_score(y_test, predictions, average='weighted', zero_division=0)
rec_w    = recall_score(y_test, predictions, average='weighted', zero_division=0)
f1_w     = f1_score(y_test, predictions, average='weighted', zero_division=0)
bal_acc  = balanced_accuracy_score(y_test, predictions)
kappa    = cohen_kappa_score(y_test, predictions)

print("\n" + "=" * 55)
print("         MODEL PERFORMANCE METRICS")
print("=" * 55)
print(f"  Accuracy          : {acc:.4f}")
print(f"  Precision (W)     : {prec_w:.4f}")
print(f"  Recall (W)        : {rec_w:.4f}")
print(f"  F1 Score (W)      : {f1_w:.4f}")
print(f"  Balanced Accuracy : {bal_acc:.4f}")
print(f"  Cohen's Kappa     : {kappa:.4f}")
print("=" * 55)

# ================================
# 11. CONFUSION MATRIX — heatmap image + text table
# ================================
cm = confusion_matrix(y_test, predictions)
class_names = encoder.classes_  # dynamic — whatever labels exist in your dataset

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Greens',
            xticklabels=class_names, yticklabels=class_names)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("White Root Disease Risk — Confusion Matrix")
plt.tight_layout()
plt.savefig(MODELS_DIR / "confusion_matrix.png", dpi=150)
print(f"\nConfusion matrix saved to {MODELS_DIR / 'confusion_matrix.png'}")

print("\n" + "=" * 55)
print("         CONFUSION MATRIX (counts + row %)")
print("=" * 55)
print(f"{'Actual \\ Predicted':<18}", end="")
for name in class_names:
    print(f"{name:<16}", end="")
print()

cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
for i, name in enumerate(class_names):
    print(f"{name:<18}", end="")
    for j in range(len(class_names)):
        print(f"{cm[i,j]:>3} ({cm_norm[i,j]*100:5.1f}%)  ", end="")
    print()
print("=" * 55)

# ================================
# 12. PER-CLASS METRICS + FULL CLASSIFICATION REPORT
# ================================
prec_per, rec_per, f1_per, support_per = precision_recall_fscore_support(
    y_test, predictions, zero_division=0
)

print("\n" + "=" * 55)
print("         PER-CLASS BREAKDOWN")
print("=" * 55)
print(f"{'Class':<16} {'Precision':>10} {'Recall':>10} {'F1-Score':>10} {'Support':>8}")
print("-" * 55)
for i, name in enumerate(class_names):
    print(f"{name:<16} {prec_per[i]:>10.3f} {rec_per[i]:>10.3f} {f1_per[i]:>10.3f} {support_per[i]:>8.0f}")
print("=" * 55)

print("\n" + "=" * 55)
print("         CLASSIFICATION REPORT")
print("=" * 55)
print(classification_report(y_test, predictions, target_names=class_names))
print("=" * 55)

# ================================
# 13. FEATURE IMPORTANCE
# ================================
importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=True)

plt.figure(figsize=(10, 6))
plt.barh(importance_df['feature'], importance_df['importance'], color='forestgreen')
plt.xlabel('Importance')
plt.title('Feature Importances (Sensor-Only Model)')
plt.tight_layout()
plt.savefig(MODELS_DIR / "feature_importance.png", dpi=150)
print(f"Feature importance saved to {MODELS_DIR / 'feature_importance.png'}")

# ================================
# 14. CROSS-VALIDATION
# ================================
print("\n" + "=" * 60)
print("5-FOLD CROSS-VALIDATION")
print("=" * 60)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = ['accuracy', 'precision_weighted', 'recall_weighted', 'f1_weighted', 'balanced_accuracy']

cv_results = cross_validate(
    model, X, y_encoded, cv=cv, scoring=scoring,
    params={'sample_weight': np.array([class_weight_dict[y] for y in y_encoded])}
)

for metric in scoring:
    scores = cv_results[f'test_{metric}']
    print(f"{metric:25s}: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")

# ================================
# 15. SANITY CHECK PREDICTIONS (sensor-only)
# ================================
print("\n" + "=" * 60)
print("SANITY CHECK PREDICTIONS")
print("=" * 60)

def build_features(ph, moist, temp):
    data = {
        'Soil_pH': ph,
        'Soil_Moisture_VWC_%': moist,
        'Soil_Temp_C': temp,
        'Moisture_stress': 1 if (moist < 22 or moist > 38) else 0,
        'Temp_stress': 1 if temp > 30 else 0,
        'Combined_stress_score': (1 if (moist < 22 or moist > 38) else 0) +
                                  (1 if temp > 30 else 0) +
                                  (1 if ph < 5.0 else 0),
    }
    df_temp = pd.DataFrame([data])
    df_temp['pH_category'] = pd.cut(df_temp['Soil_pH'], bins=[0, 5.0, 6.5, 14],
                                     labels=['Acidic', 'Optimal_pH', 'Alkaline'])
    df_temp = pd.get_dummies(df_temp, columns=['pH_category'])
    for col in feature_cols:
        if col not in df_temp.columns:
            df_temp[col] = 0
    return df_temp[feature_cols]

test_cases = [
    (5.8, 38.0, 28.0, "Expected HIGH  — very wet + warm"),
    (5.9, 31.5, 27.0, "Expected MEDIUM — average conditions"),
    (6.8, 22.0, 21.0, "Expected LOW   — dry + cool + alkaline"),
    (4.5, 42.0, 32.0, "Expected CRITICAL/HIGH — acidic + wet + hot"),
]

for ph, moist, temp, desc in test_cases:
    feat_vec = build_features(ph, moist, temp)
    pred = encoder.inverse_transform(model.predict(feat_vec))[0]
    prob = model.predict_proba(feat_vec)[0]
    conf = max(prob) * 100
    print(f"\n{desc}")
    print(f"  Input: pH={ph}, moisture={moist}%, temp={temp}°C")
    print(f"  → {pred} ({conf:.1f}% confidence)")
    probs = {class_names[i]: round(float(p), 3) for i, p in enumerate(prob)}
    print(f"  Probabilities: {probs}")

# ================================
# 16. SAVE MODEL & ENCODER
# ================================
joblib.dump(model, MODELS_DIR / "xgboost_model.pkl")
joblib.dump(encoder, MODELS_DIR / "label_encoder.pkl")
joblib.dump(feature_cols, MODELS_DIR / "feature_columns.pkl")

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)
print(f"✓ {MODELS_DIR / 'xgboost_model.pkl'}")
print(f"✓ {MODELS_DIR / 'label_encoder.pkl'}")
print(f"✓ {MODELS_DIR / 'feature_columns.pkl'}")
print("\nDone!")