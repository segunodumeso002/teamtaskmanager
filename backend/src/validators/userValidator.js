import { HttpError } from '../http/errors.js'
import { assertRequired } from './common.js'

export function validateCreateUser(payload) {
  assertRequired(payload?.name, 'name')
  assertRequired(payload?.email, 'email')
  assertRequired(payload?.role, 'role')

  const normalizedEmail = String(payload.email).trim().toLowerCase()
  if (!normalizedEmail.includes('@')) {
    throw new HttpError(400, "Field 'email' must be a valid email address.")
  }

  if (!['member', 'manager'].includes(payload.role)) {
    throw new HttpError(400, "Field 'role' must be either 'member' or 'manager'.")
  }
}