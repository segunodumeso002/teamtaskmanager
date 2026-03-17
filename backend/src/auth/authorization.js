import { HttpError } from '../http/errors.js'

export function requireAuthenticated(identity) {
  if (!identity) {
    throw new HttpError(401, 'Authentication required.')
  }
}

export function requireRole(identity, allowedRoles) {
  requireAuthenticated(identity)

  if (!allowedRoles.includes(identity.role)) {
    throw new HttpError(403, 'You are not authorized for this action.')
  }
}
