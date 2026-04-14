import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.models import OptimizationRequest
from app.optimizer.ga_scheduler import optimize_harvest_schedule

sample_path = PROJECT_ROOT / "app" / "data" / "sample_request.json"
request = OptimizationRequest.model_validate_json(sample_path.read_text())
response = optimize_harvest_schedule(request)
print(json.dumps(response.model_dump(mode="json"), indent=2))
