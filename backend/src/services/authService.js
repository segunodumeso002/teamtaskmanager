import { HttpError } from '../http/errors.js'
import { validateLoginPayload } from '../validators/authValidator.js'

export async function login(repository, payload) {
  validateLoginPayload(payload)

  const session = await repository.login(payload)
  if (!session) {
    throw new HttpError(401, 'Invalid login credentials.')
  }

  return session
}
