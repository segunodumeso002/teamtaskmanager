import { noContent, ok } from '../http/response.js'
import { createTask, deleteTask, updateTask } from '../services/taskService.js'

export async function createTaskHandler({ repository, body, identity }) {
  const task = await createTask(repository, body, identity)
  return ok(task, 201)
}

export async function updateTaskHandler({ repository, body, params, identity }) {
  const task = await updateTask(repository, params.taskId, body, identity)
  return ok(task)
}

export async function deleteTaskHandler({ repository, params, identity }) {
  await deleteTask(repository, params.taskId, identity)
  return noContent()
}
