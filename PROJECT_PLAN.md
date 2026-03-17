# Team Task Manager Portfolio Plan

## Product Scope
- Authentication with role-based access: `admin`, `manager`, `member`
- Projects with CRUD and membership
- Tasks with CRUD, kanban status columns, assignees, priorities, due dates
- Task comments and activity timeline
- Filtering by search text, assignee, priority, and status

## Current Stage
- Frontend MVP scaffold is implemented with local state persistence for rapid iteration.
- Next step is to replace local storage with real backend APIs.

## AWS Backend Architecture (Production Target)
- API: Amazon API Gateway (HTTP API)
- Compute: AWS Lambda (Node.js)
- Auth: Amazon Cognito (User Pool + App Client)
- Data: Amazon DynamoDB
- File uploads (optional): Amazon S3 + pre-signed URLs
- Observability: CloudWatch Logs, CloudWatch Alarms, AWS X-Ray
- Security: IAM least privilege, WAF on API entry if public usage grows

## Suggested DynamoDB Design
- `users` table
  - `pk`: `USER#{userId}`
- `projects` table
  - `pk`: `PROJECT#{projectId}`
- `project_members` table
  - `pk`: `PROJECT#{projectId}`
  - `sk`: `USER#{userId}`
- `tasks` table
  - `pk`: `PROJECT#{projectId}`
  - `sk`: `TASK#{taskId}`
  - GSI: `assigneeId + status` for personal views
- `comments` table
  - `pk`: `TASK#{taskId}`
  - `sk`: `COMMENT#{timestamp}#{commentId}`

## API Endpoints (v1)
- `POST /auth/login` (or Cognito hosted flow)
- `GET /projects`
- `POST /projects`
- `PATCH /projects/{projectId}`
- `DELETE /projects/{projectId}`
- `GET /projects/{projectId}/tasks`
- `POST /projects/{projectId}/tasks`
- `PATCH /tasks/{taskId}`
- `DELETE /tasks/{taskId}`
- `GET /tasks/{taskId}/comments`
- `POST /tasks/{taskId}/comments`
- `DELETE /comments/{commentId}`

## Netlify Frontend Deployment
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL`
  - `VITE_COGNITO_USER_POOL_ID`
  - `VITE_COGNITO_CLIENT_ID`
  - `VITE_AWS_REGION`

## Production Readiness Checklist
- Input validation on all API payloads
- Authorization checks on every mutation
- Error boundaries + loading and empty states in frontend
- Request retry/backoff for transient failures
- Audit logs for critical actions (task deletion, role changes)
- CI checks: lint, tests, build
- E2E test coverage for auth and core board workflows
- Environment separation: `dev`, `staging`, `prod`
- Backup and recovery plan for DynamoDB

## Portfolio Quality Targets
- Responsive UI for mobile and desktop
- Clear role-based behavior in demo
- Professional README with architecture diagram and screenshots
- Live Netlify URL + short demo video + GitHub repo
