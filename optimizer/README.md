# CinnamonSync — GA Optimizer

Python FastAPI service implementing a full **Genetic Algorithm based Vehicle Routing Problem (VRP)** optimizer for CinnamonSync. Called by the Node.js backend to generate optimized weekly harvest schedules. Also supports direct health checks from the frontend.

---

## Tech Stack

| Package | Version |
|---------|---------|
| Python | 3.11 (3.14 not supported by pydantic-core) |
| FastAPI | 0.115.6 |
| Uvicorn | 0.34.0 |
| Pydantic | 2.10.4 |
| NumPy | 2.2.1 |
| python-dateutil | 2.9.0 |
| python-dotenv | 1.2.2 |
| pytest | 8.3.4 |

---

## What It Does

Given a list of harvest-ready farms and available Kalliya peeler groups, the optimizer:

1. **Assigns** each farm to the most suitable peeler group
2. **Sequences** the route each group should follow (visit order)
3. **Minimises** total travel distance while respecting deadlines, capacities, and urgency

---

## Optimization Factors

The fitness function considers:

- Farm GPS coordinates and peeler group starting location
- Total route distance (haversine)
- Farm tree count vs. peeler group capacity (trees/hour × hours/day × available days)
- Harvest urgency level (1–5)
- Deadline and ready-from date
- Processing category priority (ALBA > C5_SPECIAL > C5 > H1 > H2)
- Peeler skill level and rating
- Workload balance between groups
- Capacity overload penalties

---

## GA Implementation

| Component | Detail |
|-----------|--------|
| Chromosome | Permutation (route order) + vehicle assignment array |
| Crossover | Order crossover (routes) + uniform crossover (assignment) |
| Mutation | Swap mutation, inversion mutation, peeler reassignment |
| Selection | Tournament selection + elitism |
| Post-process | 2-opt local route improvement |

---

## Folder Structure

```
optimizer/
├── app/
│   ├── main.py               # FastAPI entry point
│   ├── models.py             # Pydantic request/response schemas
│   ├── data/
│   │   └── sample_request.json
│   └── optimizer/
│       ├── distance.py       # Haversine distance calculation
│       └── ga_scheduler.py   # Full VRP GA implementation
├── scripts/
│   └── run_sample.py         # Run algorithm locally without the API
├── tests/
│   └── test_optimizer.py
├── requirements.txt
├── .env                      # Local environment variables
└── README.md
```

---

## Setup

> **Python 3.11 is required.** Python 3.14 is not supported by `pydantic-core`.

```bash
cd optimizer
python3.11 -m venv .venv
```

**macOS / Linux**
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows**
```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file in the `optimizer/` directory:

```env
CORS_ORIGIN=http://localhost:5173,https://cinnamonsync.netlify.app
PORT=8001
```

---

## Run

```bash
python -m app.main
```

The server reads `PORT` from `.env` and starts on `http://localhost:8001`.

API docs (Swagger): **http://localhost:8001/docs**

---

## API

```
GET  /health     — health check (used by frontend to wake up the service)
POST /optimize   — run the GA optimizer
```

The Node.js backend calls `/optimize` automatically when the admin runs optimization. The frontend calls `/health` directly before triggering optimization to handle Render free-tier cold starts.

You can also test manually using the sample payload at `app/data/sample_request.json` via the Swagger docs.

---

## Run Algorithm Directly (no API)

```bash
python scripts/run_sample.py
```

---

## Run Tests

```bash
pytest
```

---

## Production Note

Distance calculations use haversine (straight-line GPS distance). For production, replace with Google Distance Matrix API for road distances.

The optimizer is deployed as a separate service on Render free tier. It may sleep after 15 minutes of inactivity — the frontend handles this by pinging `/health` before running optimization.
