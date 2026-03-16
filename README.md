# Team Task Manager (Mini Jira/Trello)

Portfolio-grade task management app built with React + Vite + Tailwind CSS v3.

## Features
- Demo authentication with role switching: `admin`, `manager`, `member`
- Project management with role-aware create permissions
- Kanban board with status columns: Backlog, In Progress, Review, Done
- Task CRUD with assignee, priority, due date, and status updates
- Task comments with role-based delete rules
- Filtering by search, assignee, and priority
- Local persistence with `localStorage` for fast MVP iteration
- Backend-ready API service layer with local/remote runtime mode

## Local Setup
```bash
npm install --legacy-peer-deps
npm run dev
```

## Run Backend Scaffold
```bash
cd backend
npm install
npm run start
```

Then set frontend `.env`:
```bash
VITE_API_BASE_URL=http://localhost:4000
```

## Build
```bash
npm run build
```

## Backend Connection (AWS Step 1)
1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` to your deployed API Gateway base URL.
3. Restart dev server.

When `VITE_API_BASE_URL` is not set, the app runs in local mode.
When it is set, the app calls remote endpoints described in `docs/api-contract.md`.

## Tech Stack
- React 19 + Vite
- Tailwind CSS 3
- Context + reducer state management

## Deployment Targets
- Frontend: Netlify
- Backend: AWS (API Gateway + Lambda + DynamoDB + Cognito)

See `PROJECT_PLAN.md` for the full production architecture and checklist.
For backend Cognito click-by-click setup, see `backend/infra/cognito-setup.md`.
