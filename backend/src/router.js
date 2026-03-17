import { loginHandler } from './endpoints/auth.js'
import { bootstrapHandler } from './endpoints/bootstrap.js'
import { addCommentHandler, deleteCommentHandler } from './endpoints/comments.js'
import { healthHandler } from './endpoints/health.js'
import { createProjectHandler } from './endpoints/projects.js'
import { createTaskHandler, deleteTaskHandler, updateTaskHandler } from './endpoints/tasks.js'
import { createUserHandler } from './endpoints/users.js'
import { HttpError } from './http/errors.js'

function matchPath(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params = {}

  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
      continue
    }

    if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

const routes = [
  { method: 'GET', pattern: '/health', handler: healthHandler },
  { method: 'GET', pattern: '/bootstrap', handler: bootstrapHandler },
  { method: 'POST', pattern: '/auth/login', handler: loginHandler },
  {
    method: 'POST',
    pattern: '/users',
    handler: createUserHandler,
    auth: { required: true, roles: ['admin'] },
  },
  {
    method: 'POST',
    pattern: '/projects',
    handler: createProjectHandler,
    auth: { required: true, roles: ['admin', 'manager'] },
  },
  {
    method: 'POST',
    pattern: '/tasks',
    handler: createTaskHandler,
    auth: { required: true, roles: ['admin', 'manager', 'member'] },
  },
  {
    method: 'PATCH',
    pattern: '/tasks/:taskId',
    handler: updateTaskHandler,
    auth: { required: true, roles: ['admin', 'manager', 'member'] },
  },
  {
    method: 'DELETE',
    pattern: '/tasks/:taskId',
    handler: deleteTaskHandler,
    auth: { required: true, roles: ['admin', 'manager', 'member'] },
  },
  {
    method: 'POST',
    pattern: '/tasks/:taskId/comments',
    handler: addCommentHandler,
    auth: { required: true, roles: ['admin', 'manager', 'member'] },
  },
  {
    method: 'DELETE',
    pattern: '/comments/:commentId',
    handler: deleteCommentHandler,
    auth: { required: true, roles: ['admin', 'manager', 'member'] },
  },
]

export function resolveRoute(method, path) {
  for (const route of routes) {
    if (route.method !== method) {
      continue
    }

    const params = matchPath(route.pattern, path)
    if (!params) {
      continue
    }

    return { route, params }
  }

  throw new HttpError(404, `No route found for ${method} ${path}.`)
}

export async function executeRoute({ route, repository, body, params, identity }) {
  return route.handler({ repository, body, params, identity })
}
