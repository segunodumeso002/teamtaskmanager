import { ok } from '../http/response.js'
import { createProject } from '../services/projectService.js'

export async function createProjectHandler({ repository, body, identity }) {
  const project = await createProject(repository, body, identity)
  return ok(project, 201)
}
