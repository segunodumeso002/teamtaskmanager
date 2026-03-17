import { assertRequired } from './common.js'

export function validateLoginPayload(payload) {
  assertRequired(payload?.userId || payload?.email, 'userId/email')
}
