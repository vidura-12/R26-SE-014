# CinnamonSync — Frontend

React + Vite web app for CinnamonSync. Provides role-based dashboards for admins, farmers, and peeler groups to manage cinnamon harvest requests, schedules, and assignments.

---

## Tech Stack

| Package | Version |
|---------|---------|
| React | ^19.0.0 |
| Vite | ^6.1.0 |
| Tailwind CSS | ^4.0.6 (via `@tailwindcss/postcss`) |
| React Router | ^7.1.5 |
| Axios | ^1.8.4 |
| Leaflet + react-leaflet | ^1.9.4 / ^5.0.0 |
| Recharts | ^2.15.3 |
| date-fns | ^4.1.0 |
| Heroicons | ^2.2.0 |
| sonner (toasts) | ^2.0.7 |

---

## Folder Structure

```
frontend/src/
├── api/
│   ├── client.js             # Axios instance (attaches JWT)
│   └── index.js              # API helpers (authApi, farmersApi, harvestApi, …)
├── assets/
│   ├── image-1.jpg           # Hero image
│   ├── image-2.jpg           # Spices hero image
│   ├── image-3.jpg           # Cinnamon farm image
│   └── logo.png
├── components/
│   ├── Card.jsx
│   ├── Layout.jsx            # App shell (sidebar + topbar)
│   ├── LocationPicker.jsx    # Interactive map pin + reverse geocode
│   ├── Map.jsx               # PinMap / OverviewMap display components
│   ├── NotificationBell.jsx  # Bell icon with unread count + dropdown
│   ├── ProtectedRoute.jsx    # Role-gated route wrapper
│   ├── Sidebar.jsx
│   ├── Spinner.jsx
│   ├── StatusBadge.jsx
│   └── TopBar.jsx
├── context/
│   └── AuthContext.jsx       # JWT auth state + login/logout
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx     # Stats + quick actions
│   │   ├── Farmers.jsx       # Farmer CRUD + map panel
│   │   ├── Harvests.jsx      # Harvest request management + status updates
│   │   ├── Optimization.jsx  # Run GA optimizer, pick date range
│   │   ├── Peelers.jsx       # Peeler group CRUD + map panel
│   │   ├── Profile.jsx       # Admin account settings
│   │   ├── Schedules.jsx     # View generated schedules
│   │   └── Users.jsx         # User management
│   ├── farmer/
│   │   ├── FarmerHome.jsx    # Stats overview + recent requests
│   │   ├── HarvestRequests.jsx  # Submit / edit / cancel requests
│   │   └── Profile.jsx       # Farmer profile settings
│   └── peeler/
│       ├── Account.jsx       # Peeler account settings
│       ├── MyGroup.jsx       # Peeler group details + availability
│       ├── PeelerHome.jsx    # Overview
│       └── PeelerRoutes.jsx  # Assigned harvest routes
├── App.jsx
├── index.css                 # Tailwind theme + Leaflet z-index overrides
└── main.jsx
```

---

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173**

The app talks to the backend at `http://localhost:5000/api/v1` (configured in `src/api/client.js`).

---

## Routes

| Path | Role | Page |
|------|------|------|
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/admin` | Admin | Dashboard |
| `/admin/farmers` | Admin | Farmers CRUD |
| `/admin/peelers` | Admin | Peeler Groups CRUD |
| `/admin/harvests` | Admin | Harvest Requests |
| `/admin/optimization` | Admin | Run Optimizer |
| `/admin/schedules` | Admin | View Schedules |
| `/admin/users` | Admin | User Management |
| `/admin/profile` | Admin | Profile Settings |
| `/farmer` | Farmer | Home Overview |
| `/farmer/harvests` | Farmer | My Harvest Requests |
| `/farmer/profile` | Farmer | Profile Settings |
| `/peeler` | Peeler | Home Overview |
| `/peeler/routes` | Peeler | My Routes |
| `/peeler/group` | Peeler | My Group |
| `/peeler/account` | Peeler | Account Settings |

---

## Key Features

### Search
Farmers, Peeler Groups, Harvest Requests, and System Users pages all support server-side search. Press **Enter** to trigger the search, click **×** to clear. The layout stays mounted during loading (opacity fade + spinner) — no full-page remount on search.

### Location Picker
All forms that require a location (harvest requests, farmer profiles, peeler groups) use the shared `LocationPicker` component. Click anywhere on the map to pin a location — district and address are auto-filled via Nominatim reverse geocoding.

### Harvest Status
- **Admin** can change harvest request status from the Harvest Requests page and from the per-stop dropdown in the Schedules page
- **Farmers** can change the status of their own harvest requests
- **Peelers** see the harvest status as a read-only badge on each route stop in My Routes

### Schedules (Admin)
The Schedules detail panel shows each peeler group's route with per-stop harvest status dropdowns. The status selector is separated from stop details by a divider row (label left, dropdown right).

### Peeler Home
The Current Week Schedule card matches today's date against `weekStartDate`–`weekEndDate`. Recent schedule rows are clickable and navigate to My Routes.

### Notifications
The bell icon in the top bar polls `/api/v1/notifications` every 30 seconds. Notifications are color-coded by type:
- **Amber** — harvest status change
- **Green** — schedule assigned
- **Purple** — new harvest request (admin)
- **Gray** — general

### Role-Based Layout
- **Admin** sees: Dashboard, Farmers, Peeler Groups, Harvest Requests, Optimization, Schedules, Users, Profile
- **Farmer** sees: Home, My Harvest Requests, Profile
- **Peeler** sees: Home, My Routes, My Group, Account

---

## Build

```bash
npm run build
```

Output goes to `dist/`. Deployed to Netlify (see `netlify.toml` in project root).
