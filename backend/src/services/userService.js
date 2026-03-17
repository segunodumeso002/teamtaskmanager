import { HttpError } from '../http/errors.js'
import { validateCreateUser } from '../validators/userValidator.js'

export async function createUser(repository, payload, actor) {
  validateCreateUser(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  if (actor.role !== 'admin') {
    throw new HttpError(403, 'Only admin can add users.')
  }

  return repository.createUser({
    name: payload.name,
    email: String(payload.email).trim().toLowerCase(),
    role: payload.role,
  })
}