# Team Task Manager (Mini Jira/Trello)

Portfolio-grade full-stack task management app showing role-based collaboration workflows.

This project demonstrates:
- Authentication and role-based access (`admin`, `manager`, `member`)
- Project, task, and comment CRUD
- Kanban board UX with filtering and status management
- Frontend state architecture with context + reducer
- API design with service/repository layers in backend
- Cloud deployment on AWS + Netlify

## Live Project
- Frontend (Netlify): Add your live URL here
- Backend (AWS API): Add your API base URL here

## Core Features
- Demo login with role switching (`admin`, `manager`, `member`)
- Admin user management:
	- Create new users
	- Assign role (`member` or `manager`)
	- Promote/demote users (`PATCH /users/{userId}`)
- Project creation with role-aware authorization
- Task management:
	- Create
	- Update status/priority
	- Delete (permission-aware)
- Task comments with permission rules
- Session handling:
	- Token storage
	- Auto-logout on unauthorized (`401`)
	- Startup diagnostics with backend health checks

## Architecture

### Frontend
- Stack: React 19 + Vite + Tailwind CSS
- State management: context + reducer in [src/context/TaskManagerContext.jsx](src/context/TaskManagerContext.jsx)
- API client: [src/api/httpClient.js](src/api/httpClient.js) and [src/api/taskManagerApi.js](src/api/taskManagerApi.js)
- Permissions: [src/lib/permissions.js](src/lib/permissions.js)
- Main UI: [src/components/BoardScreen.jsx](src/components/BoardScreen.jsx)

### Backend
- Runtime: Node.js (Lambda-style handler)
- Router: [backend/src/router.js](backend/src/router.js)
- Service layer: [backend/src/services](backend/src/services)
- Repository layer: in-memory + DynamoDB
- Auth modes:
	- `dev` mode token (`dev-token-{userId}`)
	- `cognito` mode JWT verification

### Data Flow (high-level)
1. UI action dispatches context method.
2. Context calls API layer.
3. Backend router resolves endpoint and auth policy.
4. Service enforces business rules.
5. Repository reads/writes data (memory or DynamoDB).

## API Overview
See full contract in [docs/api-contract.md](docs/api-contract.md).

Main endpoints:
- `POST /auth/login`
- `GET /bootstrap`
- `GET /health`
- `POST /users` (admin)
- `PATCH /users/{userId}` (admin)
- `POST /projects`
- `POST /tasks`
- `PATCH /tasks/{taskId}`
- `DELETE /tasks/{taskId}`
- `POST /tasks/{taskId}/comments`
- `DELETE /comments/{commentId}`

## Local Development

### Frontend
```bash
npm install --legacy-peer-deps
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run start
```

### Frontend env
Set in [.env](.env):
```bash
VITE_API_BASE_URL=http://localhost:4000
```

If `VITE_API_BASE_URL` is empty, app runs in local mode.

## Testing

### Run all tests
```bash
npm run test:all
```

### Frontend tests
```bash
npm run test
```

### Backend tests
```bash
npm run test:backend
```

Current lightweight test coverage includes:
- Frontend role guard helpers
- Backend auth service
- Backend user service authorization and error paths (`401`, `403`, `409`)

## Build
```bash
npm run build
```

## Deployment

### Backend (AWS)
- Lambda + API Gateway HTTP API + DynamoDB
- Region: `us-east-1`
- Typical function: `ttm-backend-dev`
- Ensure Lambda env vars match [backend/src/config.js](backend/src/config.js)

### Frontend (Netlify)
- Netlify config: [netlify.toml](netlify.toml)
- Build command: `npm run build`
- Publish directory: `dist`
- Required env var:
	- `VITE_API_BASE_URL=<your_api_gateway_base_url>`

## Demo Script (Interview-Friendly)
1. Login as admin.
2. Add a new user and assign manager role.
3. Switch to manager account and create project/task.
4. Switch to member and show restricted actions.
5. Show comment flow and role-based permissions.
6. Mention automated tests and deployment architecture.

## Release Notes (v1.0)
- Complete auth + role-aware CRUD flow
- Admin user creation and role management
- Backend health endpoint and startup diagnostics
- Session-expiry handling on frontend
- AWS + Netlify deployment complete

## Known Limitations / Tradeoffs
- Demo auth in `dev` mode is not production-grade identity management.
- No pagination yet for large datasets.
- No audit log/history for role changes.
- Minimal automated test suite (focused on critical service logic).

## Cost Strategy
- Built with free-first services (Netlify free tier + low-cost AWS serverless).
- No always-on compute resources required.

## Project Planning Reference
- Implementation plan: [PROJECT_PLAN.md](PROJECT_PLAN.md)
