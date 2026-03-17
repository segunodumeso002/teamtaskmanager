# API Contract (Step 1)

Base URL comes from `VITE_API_BASE_URL`.

## Auth
- `POST /auth/login`

Request:
```json
{
  "email": "andrew@taskflow.dev",
  "password": "secret"
}
```

Response:
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "u1",
    "name": "Andrew Tierney",
    "email": "andrew@taskflow.dev",
    "role": "admin"
  }
}
```

## Bootstrap
- `GET /bootstrap`

Response:
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

## Projects
- `POST /projects`

Request:
```json
{
  "name": "Portfolio Platform Launch",
  "description": "Ship a polished portfolio platform",
  "memberIds": ["u1"],
  "createdBy": "u1"
}
```

Response: full project object.

## Users
- `POST /users` (admin only)

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "member"
}
```

`role` supports: `member`, `manager`.

Response: full user object.

## Tasks
- `POST /tasks`
- `PATCH /tasks/{taskId}`
- `DELETE /tasks/{taskId}`

`POST /tasks` request:
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

Response: full task object.

## Comments
- `POST /tasks/{taskId}/comments`
- `DELETE /comments/{commentId}`

`POST` request:
```json
{
  "taskId": "t1",
  "authorId": "u1",
  "body": "Looks good"
}
```

Response: full comment object.
