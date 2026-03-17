import { createId } from '../utils/id.js'
import { HttpError } from '../http/errors.js'

const users = [
  { id: 'u1', name: 'Andrew Tierney', email: 'andrew@taskflow.dev', role: 'admin' },
  { id: 'u2', name: 'Ada Mensah', email: 'ada@taskflow.dev', role: 'manager' },
  { id: 'u3', name: 'Noah Owusu', email: 'noah@taskflow.dev', role: 'member' },
]

const projects = [
  {
    id: 'p1',
    name: 'Portfolio Platform Launch',
    description: 'Ship a polished portfolio platform for job applications.',
    members: [
      { userId: 'u1', role: 'manager' },
      { userId: 'u2', role: 'manager' },
      { userId: 'u3', role: 'member' },
    ],
    createdBy: 'u1',
    createdAt: '2026-03-09T10:00:00.000Z',
  },
]

const tasks = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Design board experience',
    description: 'Create responsive kanban columns and card interactions.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u3',
    creatorId: 'u2',
    dueDate: '2026-03-15',
    createdAt: '2026-03-09T10:05:00.000Z',
  },
]

const comments = [
  {
    id: 'c1',
    taskId: 't1',
    authorId: 'u2',
    body: 'Keep interactions smooth on mobile and desktop.',
    createdAt: '2026-03-09T10:20:00.000Z',
  },
]

let currentUserId = 'u1'
let activeProjectId = 'p1'

export const inMemoryStore = {
  getUserById(userId) {
    return users.find((user) => user.id === userId) ?? null
  },

  getUserByEmail(email) {
    return users.find((user) => user.email === email) ?? null
  },

  getTaskById(taskId) {
    return tasks.find((task) => task.id === taskId) ?? null
  },

  getCommentById(commentId) {
    return comments.find((comment) => comment.id === commentId) ?? null
  },

  getBootstrapState() {
    return {
      currentUserId,
      activeProjectId,
      users,
      projects,
      tasks,
      comments,
    }
  },

  login({ userId, email }) {
    const user = users.find((entry) => entry.id === userId || entry.email === email)
    if (!user) return null

    currentUserId = user.id

    return {
      accessToken: `dev-token-${user.id}`,
      refreshToken: `dev-refresh-${user.id}`,
      user,
    }
  },

  createProject(payload) {
    const created = {
      id: createId('p'),
      name: payload.name,
      description: payload.description ?? '',
      members: payload.memberIds.map((memberId) => ({
        userId: memberId,
        role: memberId === payload.createdBy ? 'manager' : 'member',
      })),
      createdBy: payload.createdBy,
      createdAt: new Date().toISOString(),
    }

    projects.push(created)
    activeProjectId = created.id

    return created
  },

  createUser(payload) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail)

    if (existing) {
      throw new HttpError(409, 'A user with that email already exists.')
    }

    const created = {
      id: createId('u'),
      name: payload.name,
      email: normalizedEmail,
      role: payload.role,
    }

    users.push(created)
    return created
  },

  createTask(payload) {
    const created = {
      id: createId('t'),
      createdAt: new Date().toISOString(),
      ...payload,
    }

    tasks.push(created)
    return created
  },

  updateTask(taskId, updates) {
    const index = tasks.findIndex((task) => task.id === taskId)
    if (index < 0) return null

    tasks[index] = { ...tasks[index], ...updates }
    return tasks[index]
  },

  deleteTask(taskId) {
    const index = tasks.findIndex((task) => task.id === taskId)
    if (index < 0) return false

    tasks.splice(index, 1)

    for (let i = comments.length - 1; i >= 0; i -= 1) {
      if (comments[i].taskId === taskId) {
        comments.splice(i, 1)
      }
    }

    return true
  },

  addComment(payload) {
    const created = {
      id: createId('c'),
      createdAt: new Date().toISOString(),
      ...payload,
    }

    comments.push(created)
    return created
  },

  deleteComment(commentId) {
    const index = comments.findIndex((comment) => comment.id === commentId)
    if (index < 0) return false

    comments.splice(index, 1)
    return true
  },
}
