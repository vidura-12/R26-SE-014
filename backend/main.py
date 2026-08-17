from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.predict import predict_risk
from services.advisory_engine import get_advisory

app = FastAPI(title="White Root Rot Prediction & Advisory API")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Model ─────────────────────────────────────────────────────────────
class SensorData(BaseModel):
    Soil_pH: float
    Soil_Moisture_VWC: float
    Soil_Temp_C: float

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "White Root Disease API Running"}

@app.post("/predict")
def predict(data: SensorData):
    """Existing endpoint — unchanged."""
    result = predict_risk(
        data.Soil_pH,
        data.Soil_Moisture_VWC,
        data.Soil_Temp_C,
    )
    return {
        "White_Root_Disease_Risk": result["level"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
    }

@app.post("/advisory")
def advisory(data: SensorData):
    """
    NEW: Full prediction + RAG advisory report.
    Frontend calls this to get everything in one request.
    """
    # 1. ML Prediction
    result = predict_risk(
        data.Soil_pH,
        data.Soil_Moisture_VWC,
        data.Soil_Temp_C,
    )

    # 2. RAG Advisory
    report = get_advisory(
        ph=data.Soil_pH,
        moisture=data.Soil_Moisture_VWC,
        temp=data.Soil_Temp_C,
        risk=result["level"].lower(),
        confidence=result["confidence"]
    )

    return {
        "prediction": {
            "risk_level": result["level"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"]
        },
        "advisory": report
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}