import { assertRequired } from './common.js'

export function validateCreateComment(payload) {
  assertRequired(payload?.taskId, 'taskId')
  assertRequired(payload?.authorId, 'authorId')
  assertRequired(payload?.body, 'body')
}
