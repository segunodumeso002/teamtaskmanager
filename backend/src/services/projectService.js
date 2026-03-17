import { HttpError } from '../http/errors.js'
import { validateCreateProject } from '../validators/projectValidator.js'

export async function createProject(repository, payload, actor) {
  validateCreateProject(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  if (!['admin', 'manager'].includes(actor.role)) {
    throw new HttpError(403, 'Only admin or manager can create projects.')
  }

  payload.createdBy = actor.userId

  if (!payload.memberIds.includes(actor.userId)) {
    payload.memberIds = [...payload.memberIds, actor.userId]
  }

  return repository.createProject(payload)
}
