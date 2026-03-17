import { useEffect, useMemo, useReducer, useState } from 'react'
import { taskManagerApi } from '../api/taskManagerApi'
import { demoState } from '../data/demoData'
import { loadState, saveState } from '../lib/storage'
import { TaskManagerContext } from './TaskManagerStore'

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        currentUserId: action.payload.currentUserId,
        activeProjectId: action.payload.activeProjectId,
        users: action.payload.users,
        projects: action.payload.projects,
        tasks: action.payload.tasks,
        comments: action.payload.comments,
      }
    case 'LOGIN':
      return { ...state, currentUserId: action.payload.userId }
    case 'LOGOUT':
      return { ...state, currentUserId: null }
    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload.projectId }
    case 'CREATE_PROJECT': {
      const project =
        action.payload.id
          ? action.payload
          : {
              id: createId('p'),
              name: action.payload.name,
              description: action.payload.description,
              members: action.payload.memberIds.map((userId) => ({
                userId,
                role: userId === action.payload.createdBy ? 'manager' : 'member',
              })),
              createdBy: action.payload.createdBy,
              createdAt: new Date().toISOString(),
            }

      return {
        ...state,
        projects: [...state.projects, project],
        activeProjectId: project.id,
      }
    }
    case 'CREATE_USER': {
      const user =
        action.payload.id
          ? action.payload
          : {
              id: createId('u'),
              name: action.payload.name,
              email: action.payload.email,
              role: action.payload.role,
            }

      return {
        ...state,
        users: [...state.users, user],
      }
    }
    case 'CREATE_TASK': {
      const task =
        action.payload.id
          ? action.payload
          : {
              id: createId('t'),
              createdAt: new Date().toISOString(),
              ...action.payload,
            }

      return { ...state, tasks: [...state.tasks, task] }
    }
    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task,
        ),
      }
    }
    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload.taskId),
        comments: state.comments.filter(
          (comment) => comment.taskId !== action.payload.taskId,
        ),
      }
    }
    case 'ADD_COMMENT': {
      const comment =
        action.payload.id
          ? action.payload
          : {
              id: createId('c'),
              createdAt: new Date().toISOString(),
              ...action.payload,
            }

      return { ...state, comments: [...state.comments, comment] }
    }
    case 'DELETE_COMMENT': {
      return {
        ...state,
        comments: state.comments.filter(
          (comment) => comment.id !== action.payload.commentId,
        ),
      }
    }
    default:
      return state
  }
}

function getInitialState() {
  const persisted = loadState()
  return persisted ?? JSON.parse(JSON.stringify(demoState))
}

function getProjectMemberRole(project, userId) {
  if (!project || !userId) return null
  const membership = project.members.find((member) => member.userId === userId)
  return membership?.role ?? null
}

export function TaskManagerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastError, setLastError] = useState(null)
  const backendMode = taskManagerApi.isConfigured() ? 'remote' : 'local'

  function hasAccessToken() {
    return Boolean(localStorage.getItem('ttm_access_token'))
  }

  function logoutForExpiredSession() {
    localStorage.removeItem('ttm_access_token')
    dispatch({ type: 'LOGOUT' })
    setLastError('Session expired. Please login again.')
  }

  function handleSyncError(error, fallbackMessage, options = {}) {
    const { logoutOnUnauthorized = true } = options

    if (logoutOnUnauthorized && taskManagerApi.isConfigured() && error?.status === 401) {
      logoutForExpiredSession()
      return
    }

    setLastError(error?.message || fallbackMessage)
  }

  function ensureProtectedRemoteSession() {
    if (!taskManagerApi.isConfigured()) {
      return true
    }

    if (hasAccessToken()) {
      return true
    }

    logoutForExpiredSession()
    return false
  }

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    let cancelled = false

    function formatStartupError(error, diagnostics) {
      const baseUrl = diagnostics?.baseUrl || taskManagerApi.getBaseUrl() || '(not set)'
      const healthStatus = diagnostics?.health?.status || 'unknown'
      const authMode = diagnostics?.health?.mode?.auth || 'unknown'
      const dataMode = diagnostics?.health?.mode?.data || 'unknown'
      const detail = error?.message || 'Unable to initialize backend connection.'

      return `Startup check failed. ${detail} API: ${baseUrl}. Health: ${healthStatus}. Mode: auth=${authMode}, data=${dataMode}.`
    }

    async function bootstrapRemoteState() {
      if (!taskManagerApi.isConfigured()) return

      setIsBootstrapping(true)
      setLastError(null)

      let diagnostics = null

      try {
        diagnostics = await taskManagerApi.getStartupDiagnostics()
        const bootstrapState = await taskManagerApi.getBootstrapState()
        if (!cancelled) {
          const token = localStorage.getItem('ttm_access_token')
          const hydratedState = token
            ? bootstrapState
            : { ...bootstrapState, currentUserId: null }

          dispatch({ type: 'HYDRATE', payload: hydratedState })
        }
      } catch (error) {
        if (!cancelled) {
          const startupMessage = formatStartupError(error, diagnostics)
          handleSyncError(error, startupMessage)
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapRemoteState()

    return () => {
      cancelled = true
    }
  }, [])

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  )

  const activeProject = useMemo(
    () => state.projects.find((project) => project.id === state.activeProjectId) ?? null,
    [state.projects, state.activeProjectId],
  )

  const activeProjectRole = useMemo(
    () => getProjectMemberRole(activeProject, currentUser?.id),
    [activeProject, currentUser?.id],
  )

  const value = {
    ...state,
    currentUser,
    activeProject,
    activeProjectRole,
    backendMode,
    hasRemoteSession: backendMode === 'local' || hasAccessToken(),
    isBootstrapping,
    isSyncing,
    lastError,
    clearError: () => setLastError(null),
    login: async (userId) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'LOGIN', payload: { userId } })
        return
      }

      setIsSyncing(true)
      try {
        const response = await taskManagerApi.login({ userId })
        if (response?.accessToken) {
          localStorage.setItem('ttm_access_token', response.accessToken)
        }
        const resolvedUserId = response?.user?.id ?? userId
        dispatch({ type: 'LOGIN', payload: { userId: resolvedUserId } })
      } catch (error) {
        handleSyncError(error, 'Login failed.', { logoutOnUnauthorized: false })
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    logout: () => {
      localStorage.removeItem('ttm_access_token')
      dispatch({ type: 'LOGOUT' })
    },
    setActiveProject: (projectId) =>
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: { projectId } }),
    createProject: async (payload) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'CREATE_PROJECT', payload })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        const createdProject = await taskManagerApi.createProject(payload)
        dispatch({ type: 'CREATE_PROJECT', payload: createdProject })
      } catch (error) {
        handleSyncError(error, 'Failed to create project.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    addUser: async (payload) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'CREATE_USER', payload })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        const createdUser = await taskManagerApi.createUser(payload)
        dispatch({ type: 'CREATE_USER', payload: createdUser })
      } catch (error) {
        handleSyncError(error, 'Failed to add user.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    createTask: async (payload) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'CREATE_TASK', payload })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        const createdTask = await taskManagerApi.createTask(payload)
        dispatch({ type: 'CREATE_TASK', payload: createdTask })
      } catch (error) {
        handleSyncError(error, 'Failed to create task.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    updateTask: async (taskId, updates) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        await taskManagerApi.updateTask(taskId, updates)
        dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } })
      } catch (error) {
        handleSyncError(error, 'Failed to update task.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    deleteTask: async (taskId) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'DELETE_TASK', payload: { taskId } })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        await taskManagerApi.deleteTask(taskId)
        dispatch({ type: 'DELETE_TASK', payload: { taskId } })
      } catch (error) {
        handleSyncError(error, 'Failed to delete task.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    addComment: async (payload) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'ADD_COMMENT', payload })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        const createdComment = await taskManagerApi.addComment(payload)
        dispatch({ type: 'ADD_COMMENT', payload: createdComment })
      } catch (error) {
        handleSyncError(error, 'Failed to add comment.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    deleteComment: async (commentId) => {
      setLastError(null)

      if (!taskManagerApi.isConfigured()) {
        dispatch({ type: 'DELETE_COMMENT', payload: { commentId } })
        return
      }

      if (!ensureProtectedRemoteSession()) {
        throw new Error('Session expired. Please login again.')
      }

      setIsSyncing(true)
      try {
        await taskManagerApi.deleteComment(commentId)
        dispatch({ type: 'DELETE_COMMENT', payload: { commentId } })
      } catch (error) {
        handleSyncError(error, 'Failed to delete comment.')
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
  }

  return (
    <TaskManagerContext.Provider value={value}>{children}</TaskManagerContext.Provider>
  )
}

