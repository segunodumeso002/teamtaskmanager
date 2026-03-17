import { getConfig } from '../config.js'
import { HttpError } from '../http/errors.js'
import { ok } from '../http/response.js'
import { login } from '../services/authService.js'

export async function loginHandler({ repository, body }) {
  const config = getConfig()

  if (config.authMode === 'cognito') {
    throw new HttpError(
      400,
      'Demo login is disabled in cognito mode. Switch AUTH_MODE to dev for local demo accounts.',
    )
  }

  const result = await login(repository, body)
  return ok(result)
}
