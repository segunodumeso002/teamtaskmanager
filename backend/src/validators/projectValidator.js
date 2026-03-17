import { assertArray, assertRequired } from './common.js'

export function validateCreateProject(payload) {
  assertRequired(payload?.name, 'name')
  assertRequired(payload?.createdBy, 'createdBy')
  assertArray(payload?.memberIds, 'memberIds')
}
