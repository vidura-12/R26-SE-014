import joblib

model = joblib.load('models/rf_model.pkl')

# Example prediction
ndvi = 0.45
ndmi = 0.12

risk = model.predict([[ndvi, ndmi]])

print(f"Risk Level: {risk[0]:.2f}%")