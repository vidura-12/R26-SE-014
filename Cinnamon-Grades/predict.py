from ultralytics import YOLO
import sys
from collections import Counter
import json
import cv2
import logging

import joblib
import pandas as pd
from datetime import datetime, timedelta

# suppress YOLO logs
logging.getLogger("ultralytics").setLevel(logging.ERROR)

image_path = sys.argv[1]

# check image validity
img = cv2.imread(image_path)

if img is None:
    print(json.dumps({
        "status": "Invalid Image",
        "final_grade": None,
        "details": {},
        "message": "Invalid image file."
    }))
    exit()

model = YOLO("weights/yolov8-best.pt")

# prediction
results = model(image_path, conf=0.35, verbose=False)

# trained grades
allowed_grades = ["Alba", "C4", "C5", "H2"]

det_list = []

# no detections
if len(results[0].boxes) == 0:

    print(json.dumps({
        "status": "No Cinnamon Detected",
        "final_grade": None,
        "details": {},
        "message": "Uploaded image is not related to cinnamon."
    }))
    exit()

# process detections
for box in results[0].boxes:

    conf = float(box.conf[0])

    # ignore weak detections
    if conf < 0.45:
        continue

    cls = int(box.cls[0])
    name = model.names[cls]

    # accept only trained grades
    if name in allowed_grades:
        det_list.append(name)

# unsupported / unclear grade
if len(det_list) == 0:

    print(json.dumps({
        "status": "Unknown Grade",
        "final_grade": None,
        "details": {},
        "message": "Unable to identify this cinnamon grade accurately."
    }))
    exit()

# confidence validation
avg_conf = sum([
    float(box.conf[0])
    for box in results[0].boxes
    if float(box.conf[0]) >= 0.45
]) / len(det_list)

# unsupported / uncertain prediction
if avg_conf < 0.65:

    print(json.dumps({
        "status": "Unknown Grade",
        "final_grade": None,
        "details": {},
        "message": "This cinnamon grade is not supported or image quality is unclear."
    }))
    exit()

# count grades
count = Counter(det_list)

# determine result
if len(count) == 1:

    final_grade = list(count.keys())[0]

    output = {
        "status": "Single Grade",
        "final_grade": final_grade,
        "details": dict(count)
    }
    
else:

    final_grade = count.most_common(1)[0][0]

    output = {
        "status": "Mixed Grades Detected",
        "final_grade": final_grade,
        "details": dict(count),
        "message": "This bundle contains mixed cinnamon grades."
    }

# Don't predict prices for mixed-grade bundles
if output["status"] == "Mixed Grades Detected":

    output["market_price_forecast"] = {
        "available": False,
        "message": "Market price forecasting is available only for single-grade cinnamon bundles. Please upload a single-grade bundle to receive an accurate price prediction and market recommendation."
    }

    print(json.dumps(output))
    exit()

# price prediction 

try:

    price_model = joblib.load("models/price_model.pkl")
    grade_encoder = joblib.load("models/grade_encoder.pkl")
    district_encoder = joblib.load("models/district_encoder.pkl")

    grade_mapping = {
        "Alba": "Alba",
        "C4": "C-4",
        "C5": "C-5",
        "H2": "H-2"
    }
    model_grade = grade_mapping.get(final_grade, final_grade)

    def predict_market(target_date, period_name):

        year = target_date.year
        month = target_date.month
        week = target_date.isocalendar().week

        predictions = []

        for district in district_encoder.classes_:

            # Skip non-market labels
            if district in ["Average Price", "Highest Price"]:
                continue

            grade_value = grade_encoder.transform([model_grade])[0]
            district_value = district_encoder.transform([district])[0]

            df = pd.DataFrame([{
                "Year": year,
                "Month": month,
                "Week": week,
                "District": district_value,
                "Grade": grade_value
            }])

            price = float(price_model.predict(df)[0])

            predictions.append({
                "district": district,
                "predicted_price": round(price, 2)
            })

        predictions.sort(
            key=lambda x: x["predicted_price"],
            reverse=True
        )

        # Weekly date range
        week_start = target_date - timedelta(days=target_date.weekday())
        week_end = week_start + timedelta(days=6)

        # Monthly date range
        month_start = target_date.replace(day=1)

        if target_date.month == 12:
            month_end = target_date.replace(
                year=target_date.year + 1,
                month=1,
                day=1
            ) - timedelta(days=1)
        else:
            month_end = target_date.replace(
                month=target_date.month + 1,
                day=1
            ) - timedelta(days=1)

        if period_name == "next_month":
            period = f"{month_start.strftime('%d %b %Y')} - {month_end.strftime('%d %b %Y')}"
        else:
            period = f"{week_start.strftime('%d %b %Y')} - {week_end.strftime('%d %b %Y')}"

        return {
            "forecast_period": period,
            "best_market": {
                "district": predictions[0]["district"],
                "predicted_price": predictions[0]["predicted_price"],
                "currency": "LKR/kg"
            },
            "recommendation": f"Based on historical market trends, selling in {predictions[0]['district']} during this period is expected to provide the highest market price.",
            "market_predictions": predictions
        }

    today = datetime.now()

    next_month = (today.replace(day=28) + timedelta(days=4)).replace(day=1)

    output["market_price_forecast"] = {

        "this_week": predict_market(
            today,
            "this_week"
        ),

        "next_week": predict_market(
            today + timedelta(days=7),
            "next_week"
        ),

        "next_month": predict_market(
            next_month,
            "next_month"
        )

    }

except Exception as e:

    output["market_price_forecast"] = {
        "error": str(e)
    }

# final output
print(json.dumps(output))