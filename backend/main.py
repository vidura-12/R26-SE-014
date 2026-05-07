from fastapi import FastAPI
from pydantic import BaseModel

from services.predict import predict_risk

app = FastAPI()

class SensorData(BaseModel):
    Soil_pH: float
    Soil_Moisture_VWC: float
    Soil_Temp_C: float

@app.get("/")
def home():
    return {"message": "White Root Disease API Running"}

@app.post("/predict")

def predict(data: SensorData):

    risk = predict_risk(
        data.Soil_pH,
        data.Soil_Moisture_VWC,
        data.Soil_Temp_C
    )

    return {
        "White_Root_Disease_Risk": risk
    }