# CinnamonSync — Backend

Node.js + Express + MongoDB REST API for CinnamonSync. Handles authentication, farmer and peeler group management, harvest requests, schedule storage, and persistent notifications. Calls the Python Genetic Algorithm service to generate optimized weekly schedules.

---

## Tech Stack

| Package | Version |
|---------|---------|
| Node.js | 18+ |
| Express | ^4.21.2 |
| Mongoose | ^8.9.5 |
| jsonwebtoken | ^9.0.2 |
| bcryptjs | ^2.4.3 |
| Joi | ^17.13.3 |
| Axios | ^1.7.9 |
| helmet | ^8.0.0 |
| express-rate-limit | ^7.5.0 |
| morgan | ^1.10.0 |
| dotenv | ^16.4.7 |
| nodemon (dev) | ^3.1.9 |

---

## Folder Structure

```
backend/
├── scripts/
│   └── seed.js               # Database seeder (prompts before wiping)
├── src/
│   ├── config/
│   │   └── db.js
│   ├── constants/
│   │   └── enums.js          # USER_ROLES, PROCESSING_CATEGORIES, HARVEST_STATUSES
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── farmer.controller.js
│   │   ├── harvestRequest.controller.js
│   │   ├── notification.controller.js
│   │   ├── optimization.controller.js
│   │   └── peeler.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── Farmer.js
│   │   ├── HarvestRequest.js
│   │   ├── Notification.js
│   │   ├── PeelerGroup.js
│   │   ├── Schedule.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── farmer.routes.js
│   │   ├── harvestRequest.routes.js
│   │   ├── notification.routes.js
│   │   ├── optimization.routes.js
│   │   ├── peeler.routes.js
│   │   └── index.js
│   ├── services/
│   │   ├── notification.service.js
│   │   └── token.service.js
│   ├── utils/
│   │   ├── apiError.js
│   │   └── asyncHandler.js
│   ├── validations/
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── .env
└── package.json
```

---

## Setup

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ALGO_URL=http://localhost:8001
CORS_ORIGIN=http://localhost:5173,https://cinnamonsync.netlify.app
```

---

## Run

```bash
npm run dev    # development (nodemon)
npm start      # production
```

API base: **http://localhost:5000/api/v1**

---

## Seed the Database

```bash
npm run seed
```

Prompts for confirmation, then wipes all collections and inserts:
- 1 admin, 20 farmer users, 20 peeler users (43 total)
- 21 farmer profiles
- 21 peeler groups with 7-day availability windows
- 30 harvest requests across all statuses and processing categories
- 4 demo notifications

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cinnamonsync.lk | Welcome@123 |
| Farmer | farmer@cinnamonsync.lk | Welcome@123 |
| Peeler | peeler@cinnamonsync.lk | Welcome@123 |

---

## API Endpoints

### Auth
```
POST   /auth/register
POST   /auth/login
GET    /auth/me
PATCH  /auth/update-account
GET    /auth/users              (Admin — list all users)
GET    /auth/farmer-users       (Admin — unlinked FARMER accounts)
```

### Farmers
```
GET    /farmers
GET    /farmers/:id
POST   /farmers
PUT    /farmers/:id
DELETE /farmers/:id             (Admin only — hard delete)
```

### Peeler Groups
```
GET    /peeler-groups
GET    /peeler-groups/:id
GET    /peeler-groups/me        (Peeler — own group)
POST   /peeler-groups
PUT    /peeler-groups/:id
PUT    /peeler-groups/me        (Peeler — update own group)
PATCH  /peeler-groups/:id/availability
DELETE /peeler-groups/:id       (Admin only)
```

### Harvest Requests
```
GET    /harvest-requests                  supports ?search=, ?status=, ?page=, ?limit=
GET    /harvest-requests/:id
POST   /harvest-requests                  (Farmer, Admin)
PUT    /harvest-requests/:id              (Farmer, Admin)
PATCH  /harvest-requests/:id/status       (Farmer, Admin)
DELETE /harvest-requests/:id              (Admin only)
```

### Notifications
```
GET    /notifications            (logged-in user's notifications)
PATCH  /notifications/read-all
PATCH  /notifications/:id/read
DELETE /notifications/:id
```

### Optimization
```
POST   /optimization/preview-payload
POST   /optimization/run
GET    /optimization/schedules
GET    /optimization/schedules/:id
```

---

## Notification Triggers

| Event | Who gets notified |
|-------|-------------------|
| Farmer submits a new harvest request | All admins |
| Admin or farmer changes harvest request status | The farmer who owns it |
| Admin runs optimization / generates schedule | All admins + assigned peeler users |

Notifications are stored in MongoDB and fetched by the frontend every 30 seconds.

---

## Farmer Auto-Profile

When a user registers with the `FARMER` role, a basic farmer profile is automatically created and linked to their account so they can submit harvest requests immediately without admin intervention.
