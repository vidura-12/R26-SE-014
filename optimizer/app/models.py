from __future__ import annotations

from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ProcessingCategory(str, Enum):
    ALBA = "ALBA"
    C5_SPECIAL = "C5_SPECIAL"
    C5 = "C5"
    H1 = "H1"
    H2 = "H2"
    OTHER = "OTHER"


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class FarmRequest(BaseModel):
    id: str
    farmerName: Optional[str] = None
    farmName: Optional[str] = None
    location: Location
    treeCount: int = Field(..., gt=0)
    harvestReady: bool = True
    urgency: int = Field(3, ge=1, le=5, description="1 low, 5 critical")
    processingCategory: ProcessingCategory = ProcessingCategory.OTHER
    readyFrom: Optional[date] = None
    peelabilityDeadline: Optional[date] = None
    estimatedYieldKg: Optional[float] = Field(None, ge=0)


class PeelerGroup(BaseModel):
    id: str
    groupName: Optional[str] = None
    location: Location
    groupSize: int = Field(..., gt=0)
    capacityTreesPerHour: float = Field(..., gt=0)
    availableDays: List[date] = Field(default_factory=list)
    maxHoursPerDay: float = Field(8.0, gt=0, le=16)
    rating: float = Field(4.0, ge=1, le=5)

    @field_validator("availableDays")
    @classmethod
    def sort_days(cls, days: List[date]) -> List[date]:
        return sorted(days)


class OptimizationWeights(BaseModel):
    distance: float = 1.0
    urgency: float = 10.0
    lateness: float = 45.0
    capacityOverload: float = 80.0
    workloadBalance: float = 3.0
    categoryPriority: float = 12.0
    lowRatedPeelerPenalty: float = 4.0


class GASettings(BaseModel):
    populationSize: int = Field(80, ge=20, le=500)
    generations: int = Field(180, ge=20, le=2000)
    crossoverRate: float = Field(0.85, ge=0, le=1)
    mutationRate: float = Field(0.08, ge=0, le=1)
    elitismCount: int = Field(4, ge=1, le=20)
    tournamentSize: int = Field(4, ge=2, le=10)
    randomSeed: Optional[int] = 42


class OptimizationRequest(BaseModel):
    weekStart: date
    farms: List[FarmRequest]
    peelerGroups: List[PeelerGroup]
    weights: OptimizationWeights = Field(default_factory=OptimizationWeights)
    settings: GASettings = Field(default_factory=GASettings)


class ScheduledFarm(BaseModel):
    farmId: str
    farmName: Optional[str] = None
    sequence: int
    scheduledDate: Optional[date]
    travelKmFromPrevious: float
    estimatedWorkHours: float
    urgency: int
    processingCategory: ProcessingCategory
    warning: Optional[str] = None


class PeelerSchedule(BaseModel):
    peelerGroupId: str
    groupName: Optional[str] = None
    totalTravelKm: float
    totalWorkHours: float
    assignedTreeCount: int
    route: List[ScheduledFarm]


class OptimizationSummary(BaseModel):
    totalTravelKm: float
    totalWorkHours: float
    assignedFarmCount: int
    unassignedFarmCount: int
    averageUtilizationPercent: float
    fitnessCost: float
    generationsExecuted: int


class OptimizationResponse(BaseModel):
    status: str
    summary: OptimizationSummary
    schedules: List[PeelerSchedule]
    unassignedFarmIds: List[str]
    notes: List[str]
