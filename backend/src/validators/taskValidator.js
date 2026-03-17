import { assertRequired } from './common.js'
import { HttpError } from '../http/errors.js'

export function validateCreateTask(payload) {
  assertRequired(payload?.projectId, 'projectId')
  assertRequired(payload?.title, 'title')
  assertRequired(payload?.status, 'status')
  assertRequired(payload?.priority, 'priority')
  assertRequired(payload?.creatorId, 'creatorId')
}

export function validateTaskPatch(payload) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new HttpError(400, 'Patch payload must not be empty.')
  }
}
