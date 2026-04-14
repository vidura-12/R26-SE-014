from pathlib import Path

from app.models import OptimizationRequest
from app.optimizer.ga_scheduler import optimize_harvest_schedule


def test_optimizer_returns_all_ready_farms():
    sample_path = Path(__file__).resolve().parents[1] / "app" / "data" / "sample_request.json"
    request = OptimizationRequest.model_validate_json(sample_path.read_text())
    response = optimize_harvest_schedule(request)
    assert response.status == "success"
    assert response.summary.assignedFarmCount == 5
    assigned = [farm.farmId for schedule in response.schedules for farm in schedule.route]
    assert sorted(assigned) == sorted([farm.id for farm in request.farms if farm.harvestReady])
