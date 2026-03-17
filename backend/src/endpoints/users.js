import { ok } from '../http/response.js'
import { createUser } from '../services/userService.js'

export async function createUserHandler({ repository, body, identity }) {
  const user = await createUser(repository, body, identity)
  return ok(user, 201)
}