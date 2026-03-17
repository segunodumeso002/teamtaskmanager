import { ok } from '../http/response.js'
import { createUser, updateUserRole } from '../services/userService.js'

export async function createUserHandler({ repository, body, identity }) {
  const user = await createUser(repository, body, identity)
  return ok(user, 201)
}

export async function updateUserRoleHandler({ repository, body, identity, params }) {
  const user = await updateUserRole(repository, params.userId, body, identity)
  return ok(user)
}