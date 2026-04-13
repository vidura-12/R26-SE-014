import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import OptimizationRequest, OptimizationResponse
from app.optimizer.ga_scheduler import optimize_harvest_schedule

app = FastAPI(
    title="Cinnamon Harvest GA Optimizer",
    description="Genetic Algorithm service for assigning Kalliya peeler groups to harvest-ready cinnamon farms.",
    version="1.0.0",
)

cors_origins = os.getenv("CORS_ORIGIN", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizationResponse)
def optimize(request: OptimizationRequest):
    try:
        return optimize_harvest_schedule(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001)) # Default to 8001 if PORT is not set
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
