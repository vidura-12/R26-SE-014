from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.predict import predict_risk

app = FastAPI()

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
    result = predict_risk(
        data.Soil_pH,
        data.Soil_Moisture_VWC,
        data.Soil_Temp_C,
    )
    return {
        "White_Root_Disease_Risk": result["level"],
        "confidence":              result["confidence"],
    }