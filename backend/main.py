from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.predict import predict_risk
from services.advisory_engine import get_advisory

app = FastAPI(title="White Root Rot Prediction & Advisory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SensorData(BaseModel):
    Soil_pH: float
    Soil_Moisture_VWC: float
    Soil_Temp_C: float


# ── Single source of truth for risk tiering (Low / Medium / High only) ───────
def normalize_risk_level(raw_level: str) -> str:
    """
    Collapse the model's 4-class label into the 3-tier scale shown in the UI.
    Critical is folded into High — same urgency, one less tier to display.
    Used by BOTH /predict and /advisory so they can never disagree.
    """
    key = raw_level.strip().lower().replace(" risk", "")
    if key == "critical":
        return "High"
    if key in ("low", "medium", "high"):
        return key.capitalize()
    return "Medium"  # safe fallback, should never hit


def normalize_probabilities(raw_probs: dict) -> dict:
    """Same collapse applied to the probability breakdown, so it never shows Critical either."""
    merged = {"Low": 0.0, "Medium": 0.0, "High": 0.0}
    for label, prob in raw_probs.items():
        key = label.strip().lower().replace(" risk", "")
        if key == "critical":
            key = "high"
        if key in merged:
            merged[key] += prob
    return {k: round(v, 3) for k, v in merged.items()}


@app.get("/")
def home():
    return {"message": "White Root Disease API Running"}


@app.post("/predict")
def predict(data: SensorData):
    result = predict_risk(data.Soil_pH, data.Soil_Moisture_VWC, data.Soil_Temp_C)
    return {
        "White_Root_Disease_Risk": normalize_risk_level(result["level"]),
        "confidence": result["confidence"],
        "probabilities": normalize_probabilities(result["probabilities"]),
    }


@app.post("/advisory")
def advisory(data: SensorData):
    result = predict_risk(data.Soil_pH, data.Soil_Moisture_VWC, data.Soil_Temp_C)
    normalized = normalize_risk_level(result["level"])          # "Low" | "Medium" | "High"

    report = get_advisory(
        ph=data.Soil_pH,
        moisture=data.Soil_Moisture_VWC,
        temp=data.Soil_Temp_C,
        risk=normalized.lower(),                 # "low" | "medium" | "high"
        confidence=result["confidence"] / 100,    # advisory_engine expects a 0–1 fraction
    )

    return {
        "prediction": {
            "risk_level": normalized,
            "confidence": result["confidence"],
            "probabilities": normalize_probabilities(result["probabilities"]),
        },
        "advisory": report,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}