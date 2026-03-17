import { HttpError } from '../http/errors.js'
import { validateCreateUser, validateUpdateUserRole } from '../validators/userValidator.js'

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

export async function updateUserRole(repository, userId, payload, actor) {
  validateUpdateUserRole(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  if (actor.role !== 'admin') {
    throw new HttpError(403, 'Only admin can update user roles.')
  }

  const existingUser = await repository.getUserById(userId)
  if (!existingUser) {
    throw new HttpError(404, 'User not found.')
  }

  if (existingUser.role === 'admin') {
    throw new HttpError(403, 'Admin role cannot be modified.')
  }

  const updated = await repository.updateUserRole(userId, payload.role)
  if (!updated) {
    throw new HttpError(404, 'User not found.')
  }

  return updated
}