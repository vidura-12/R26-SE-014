# CinnamonSync

AI-driven labor optimization platform for the Ceylon cinnamon harvesting industry. Connects farmers with Kalliya peeler groups using a Genetic Algorithm to generate optimized weekly harvest schedules.

---

## Project Structure

```
CinnamonSync/
├── backend/      Node.js + Express + MongoDB REST API
├── frontend/     React + Vite + Tailwind CSS web app
└── optimizer/    Python FastAPI + Genetic Algorithm (VRP) service
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.11 (recommended — 3.14 is not supported by pydantic-core) |
| pip | latest |

---

## Quick Start

Open **3 terminals** and run one in each:

```bash
# Terminal 1 — Backend API
cd backend && npm install && npm run dev

# Terminal 2 — GA Optimizer
cd optimizer
python3.11 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows
pip install -r requirements.txt
python -m app.main

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ALGO_URL=http://localhost:8001
CORS_ORIGIN=http://localhost:5173,https://cinnamonsync.netlify.app
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_ALGO_URL=http://localhost:8001
```

> In production set `VITE_ALGO_URL=https://cinnamonsync-optimizer.onrender.com` in Netlify environment variables.

### Optimizer (`optimizer/.env`)

```env
CORS_ORIGIN=http://localhost:5173
PORT=8001
```

---

## Seed the Database

```bash
cd backend
npm run seed
```

Prompts for confirmation, then wipes all collections and inserts demo data.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cinnamonsync.lk | Welcome@123 |
| Farmer | farmer@cinnamonsync.lk | Welcome@123 |
| Peeler | peeler@cinnamonsync.lk | Welcome@123 |

---

## How It Works

1. **Farmers** submit harvest requests — plantation location (pinned on an interactive map), tree count, processing category, and deadline. Farmers can also update the status of their own requests.
2. **Admin** manages users, farmers, peeler groups, and harvest requests through the dashboard. All list pages support search (press Enter to search, × to clear) with inline loading so the layout never resets.
3. **Admin** runs the GA optimizer for a given week — it assigns peeler groups to farms, sequences routes, and minimises travel distance while respecting deadlines and capacities
4. **Optimizer warm-up** — when the admin clicks "Run Optimizer", the frontend first pings the optimizer's `/health` endpoint to wake it up (Render free tier cold start), then runs the optimization
5. **Notifications** fire automatically — farmers are notified when their request status changes; admins are notified when new requests arrive or a schedule is generated
6. **Farmers** track the live status of their requests, update harvest status, and manage their profile
7. **Peelers** view their assigned route for the week — the home dashboard shows the current week's schedule (matched by today's date) and recent schedules. Clicking a schedule navigates to My Routes.
8. **Harvest status** on the Schedules page (admin) and My Routes page (peeler) shows the individual harvest request status per stop, not the schedule-level status.

---

## API Overview

| Service | Base URL (local) | Base URL (production) |
|---------|------------------|-----------------------|
| Backend | `http://localhost:5000/api/v1` | `https://cinnamonsync.onrender.com/api/v1` |
| Optimizer | `http://localhost:8001` | `https://cinnamonsync-optimizer.onrender.com` |
| Frontend proxy | — | `https://cinnamonsync.netlify.app/api/v1` |

Key endpoints:
- `GET /api/v1/health` — backend health check
- `GET /api/v1/optimization/health` — optimizer health check (proxied through backend)
- `POST /api/v1/optimization/run` — run the GA optimizer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, React Router v7, Leaflet/OpenStreetMap, Recharts |
| Backend | Node.js, Express 4, MongoDB, Mongoose 8, JWT, Joi 17 |
| Algorithm | Python 3.11, FastAPI 0.115, Genetic Algorithm (VRP), NumPy 2 |
| Auth | JWT — role-based access (Admin, Farmer, Peeler) |
| Maps | Leaflet + OpenStreetMap + Nominatim reverse geocoding |
| Database | MongoDB Atlas |
| Notifications | Persistent DB-backed, polled every 30 s from frontend |

---

## Roles & Access

| Role | Pages |
|------|-------|
| **Admin** | Dashboard, Farmers, Peeler Groups, Harvest Requests (with search), Optimization, Schedules (with per-stop harvest status change), Users (with search), Profile |
| **Farmer** | Home overview, My Harvest Requests (submit / edit / cancel / update status), Profile |
| **Peeler** | Home overview (current week schedule + recent schedules), My Routes (per-stop harvest status badge), My Group, Account |
