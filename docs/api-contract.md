# Team Task Manager API Contract

This document defines the HTTP contract for the Team Task Manager backend.

Base URL is provided by frontend environment variable:
`VITE_API_BASE_URL`

Example base URL:
`https://{api-id}.execute-api.us-east-1.amazonaws.com`

## Conventions

- Content type: `application/json`
- Auth header: `Authorization: Bearer <token>`
- Dev auth token format: `dev-token-{userId}`
- Timestamps use ISO-8601 strings
- IDs are string values (`u_*`, `p_*`, `t_*`, `c_*`)

## Auth Matrix

| Endpoint | Method | Auth Required | Allowed Roles |
|---|---|---|---|
| `/health` | GET | No | Public |
| `/auth/login` | POST | No | Public |
| `/bootstrap` | GET | No | Public |
| `/users` | POST | Yes | `admin` |
| `/users/{userId}` | PATCH | Yes | `admin` |
| `/projects` | POST | Yes | `admin`, `manager` |
| `/tasks` | POST | Yes | `admin`, `manager`, `member` |
| `/tasks/{taskId}` | PATCH | Yes | `admin`, `manager`, `member` |
| `/tasks/{taskId}` | DELETE | Yes | `admin`, `manager`, `member` |
| `/tasks/{taskId}/comments` | POST | Yes | `admin`, `manager`, `member` |
| `/comments/{commentId}` | DELETE | Yes | `admin`, `manager`, `member` |

## Endpoints

### 1) Health Check

`GET /health`

Response `200`:
```json
{
  "status": "ok",
  "timestamp": "2026-03-17T08:25:57.705Z",
  "mode": {
    "data": "dynamo",
    "auth": "dev"
  }
}
```

### 2) Login

`POST /auth/login`

Request:
```json
{
  "userId": "u1"
}
```

Alternative request shape:
```json
{
  "email": "andrew@taskflow.dev"
}
```

Response `200`:
```json
{
  "accessToken": "dev-token-u1",
  "refreshToken": "dev-refresh-u1",
  "user": {
    "id": "u1",
    "name": "Andrew Tierney",
    "email": "andrew@taskflow.dev",
    "role": "admin"
  }
}
```

### 3) Bootstrap

`GET /bootstrap`

Response `200`:
```json
{
  "currentUserId": "u1",
  "activeProjectId": "p1",
  "users": [],
  "projects": [],
  "tasks": [],
  "comments": []
}
```

### 4) Create User (Admin)

`POST /users`

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "member"
}
```

`role` allowed values:
- `member`
- `manager`

Response `201`:
```json
{
  "id": "u_ab12cd34",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "member"
}
```

### 5) Update User Role (Admin)

`PATCH /users/{userId}`

Request:
```json
{
  "role": "manager"
}
```

Response `200`:
```json
{
  "id": "u_ab12cd34",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "manager"
}
```

Notes:
- Admin users cannot be demoted/modified through this endpoint.

### 6) Create Project

`POST /projects`

Request:
```json
{
  "name": "Portfolio Platform Launch",
  "description": "Ship a polished portfolio platform",
  "memberIds": ["u1"],
  "createdBy": "u1"
}
```

Response `201`: full project object.

### 7) Create Task

`POST /tasks`

Request:
```json
{
  "projectId": "p1",
  "title": "Design board",
  "description": "Build responsive task board",
  "status": "backlog",
  "priority": "high",
  "assigneeId": "u3",
  "creatorId": "u1",
  "dueDate": "2026-03-15"
}
```

Response `201`: full task object.

### 8) Update Task

`PATCH /tasks/{taskId}`

Request (partial updates allowed):
```json
{
  "status": "in_progress",
  "priority": "medium"
}
```

Response `200`: updated task object.

### 9) Delete Task

`DELETE /tasks/{taskId}`

Response `204`.

### 10) Add Comment

`POST /tasks/{taskId}/comments`

Request:
```json
{
  "taskId": "t1",
  "authorId": "u1",
  "body": "Looks good"
}
```

Response `201`: full comment object.

### 11) Delete Comment

`DELETE /comments/{commentId}`

Response `204`.

## Error Model

Error response shape:
```json
{
  "message": "Human-readable message",
  "details": null
}
```

## Common Error Codes

| Code | Meaning | Typical Cause |
|---|---|---|
| `400` | Bad Request | Missing/invalid payload fields |
| `401` | Unauthorized | Missing/invalid/expired token |
| `403` | Forbidden | Authenticated user lacks required role |
| `404` | Not Found | Route or entity does not exist |
| `409` | Conflict | Duplicate resource (for example email already exists) |
| `500` | Server Error | Unexpected backend failure |

## Environment Modes

- `AUTH_MODE=dev`
  - Uses local dev tokens (`dev-token-{userId}`)
- `AUTH_MODE=cognito`
  - Uses Cognito JWT verification

- `DATA_MODE=memory`
  - In-memory repository for local development
- `DATA_MODE=dynamo`
  - DynamoDB repository for deployed environments
