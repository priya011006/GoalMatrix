# GoalMatrix

**GoalMatrix** is an In-House Goal Setting & Tracking Portal built for the ATOMQUEST Hackathon 1.0. It replaces spreadsheet chaos with a structured workflow for employees, managers, and HR/Admin.

## Features (BRD Coverage)

### Phase 1 — Goal Creation & Approval
- Employee goal sheet with Thrust Area, Title, Description, UoM, Target, Weightage
- Validations: total weightage = 100%, min 10% per goal, max 8 goals
- Manager approval workflow (edit inline, approve, reject for rework)
- Locked goals after approval (Admin unlock)
- Shared Goals: push departmental KPIs to multiple employees

### Phase 2 — Achievement Tracking
- Quarterly check-ins (Q1–Q4) with actuals and status
- Progress score formulas (Min, Max, Timeline, Zero-based)
- Manager check-in comments

### Governance
- Achievement reports (CSV / Excel export)
- Completion dashboard
- Audit trail for all post-lock changes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, MongoDB, JWT |
| Auth | JWT role-based (employee, manager, admin) |

## Project Structure

```
GoalMatrix/
├── backend/          # Express API (deploy separately)
├── frontend/         # React SPA (deploy separately)
└── README.md
```

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit MONGODB_URI if needed
npm install
npm run seed
npm run dev
```

> **Important:** `npm run seed` no longer wipes your data if users already exist.  
> To reset demo data only: `npm run seed:reset` (this deletes all goals & users).

API runs at `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@goalmatrix.com | password123 |
| Manager | manager@goalmatrix.com | password123 |
| Admin | admin@goalmatrix.com | password123 |

Additional employees: `jane@goalmatrix.com`, `mike@goalmatrix.com`

> **Demo mode** (`DEMO_MODE=true`): All goal-setting and check-in windows are open regardless of calendar date — ideal for hackathon demos.

## Deployment

### Backend → Render / Railway

1. Create a new Web Service from `backend/`
2. Set environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — strong random secret
   - `CLIENT_URL` — your Vercel frontend URL
   - `DEMO_MODE` — `true` for demo
3. Build: `npm install` | Start: `npm start`
4. Run seed once via shell: `npm run seed`

### Frontend → Vercel

1. Import `frontend/` as a Vercel project
2. Set `VITE_API_URL` = `https://your-api.onrender.com/api`
3. Deploy

## Architecture

```
┌─────────────┐     HTTPS/JWT      ┌─────────────┐     ┌──────────┐
│   Vercel    │ ◄────────────────► │ Render/Rail │ ◄──►│ MongoDB  │
│  (React)    │    REST API        │  (Express)  │     │  Atlas   │
└─────────────┘                    └─────────────┘     └──────────┘
```

## Demo Flow (Presentation)

1. **Employee** — Login → Create 3–4 goals (100% weight) → Submit
2. **Manager** — Review team → Edit if needed → Approve (locks goals)
3. **Employee** — Quarterly check-in → Enter actuals & status
4. **Manager** — Add check-in comment
5. **Admin** — Dashboard → Completion → Export report → Audit trail

## License

Built for ATOMQUEST Hackathon 1.0.
