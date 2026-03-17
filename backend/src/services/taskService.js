import { HttpError } from '../http/errors.js'
import { validateCreateTask, validateTaskPatch } from '../validators/taskValidator.js'

export async function createTask(repository, payload, actor) {
  validateCreateTask(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  payload.creatorId = actor.userId

  return repository.createTask(payload)
}

export async function updateTask(repository, taskId, payload, actor) {
  validateTaskPatch(payload)

  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  const existing = await repository.getTaskById(taskId)
  if (!existing) {
    throw new HttpError(404, 'Task not found.')
  }

  if (actor.role === 'member' && existing.creatorId !== actor.userId) {
    throw new HttpError(403, 'Members can only update tasks they created.')
  }

  const updated = await repository.updateTask(taskId, payload)
  if (!updated) {
    throw new HttpError(404, 'Task not found.')
  }

  return updated
}

export async function deleteTask(repository, taskId, actor) {
  if (!actor) {
    throw new HttpError(401, 'Authentication required.')
  }

  const existing = await repository.getTaskById(taskId)
  if (!existing) {
    throw new HttpError(404, 'Task not found.')
  }

  if (actor.role === 'member' && existing.creatorId !== actor.userId) {
    throw new HttpError(403, 'Members can only delete tasks they created.')
  }

  const deleted = await repository.deleteTask(taskId)
  if (!deleted) {
    throw new HttpError(404, 'Task not found.')
  }
}
