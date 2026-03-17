import { getApiBaseUrl, isApiConfigured, request } from './httpClient'

function normalizeBootstrapState(data) {
  return {
    currentUserId: data?.currentUserId ?? null,
    activeProjectId: data?.activeProjectId ?? null,
    users: Array.isArray(data?.users) ? data.users : [],
    projects: Array.isArray(data?.projects) ? data.projects : [],
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    comments: Array.isArray(data?.comments) ? data.comments : [],
  }
}

export const taskManagerApi = {
  isConfigured: () => isApiConfigured(),

  getBaseUrl: () => getApiBaseUrl(),

  async getStartupDiagnostics() {
    const health = await request('/health', { method: 'GET' })
    return {
      baseUrl: getApiBaseUrl(),
      health,
    }
  },

  async getBootstrapState() {
    const data = await request('/bootstrap', { method: 'GET' })
    return normalizeBootstrapState(data)
  },

  async login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async createProject(payload) {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async createUser(payload) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateUserRole(userId, role) {
    return request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  },

  async createTask(payload) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateTask(taskId, updates) {
    return request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async deleteTask(taskId) {
    return request(`/tasks/${taskId}`, { method: 'DELETE' })
  },

  async addComment(payload) {
    return request(`/tasks/${payload.taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async deleteComment(commentId) {
    return request(`/comments/${commentId}`, { method: 'DELETE' })
  },
}
