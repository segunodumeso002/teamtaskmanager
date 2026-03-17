import { requireAuthenticated, requireRole } from './auth/authorization.js'
import { resolveIdentity } from './auth/identity.js'
import { getConfig } from './config.js'
import { HttpError } from './http/errors.js'
import { options, errorResponse } from './http/response.js'
import { getRepository } from './repositories/index.js'
import { executeRoute, resolveRoute } from './router.js'

function parseBody(event) {
  if (!event.body) return {}

  if (typeof event.body === 'object') {
    return event.body
  }

  try {
    return JSON.parse(event.body)
  } catch {
    return {}
  }
}

function normalizePath(event) {
  return event.rawPath || event.path || '/'
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET'
  const path = normalizePath(event)

  if (method === 'OPTIONS') {
    return options()
  }

  try {
    const config = getConfig()
    const repository = getRepository()
    const body = parseBody(event)
    const { route, params } = resolveRoute(method, path)

    let identity = null
    if (route.auth?.required) {
      identity = await resolveIdentity(event, config, repository)
      requireAuthenticated(identity)

      if (route.auth.roles?.length) {
        requireRole(identity, route.auth.roles)
      }
    }

    return await executeRoute({
      route,
      body,
      repository,
      params,
      identity,
    })
  } catch (error) {
    const shouldLogAsError = !(error instanceof HttpError) || error.statusCode >= 500

    if (shouldLogAsError) {
      console.error('Unhandled backend error:', error)
    }

    return errorResponse(error)
  }
}
