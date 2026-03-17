import { ok } from '../http/response.js'
import { getBootstrapState } from '../services/bootstrapService.js'

export async function bootstrapHandler({ repository }) {
  const state = await getBootstrapState(repository)
  return ok(state)
}
