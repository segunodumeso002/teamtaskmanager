import { useMemo, useState } from 'react'
import { useTaskManager } from '../context/TaskManagerStore'
import { PRIORITIES, STATUSES } from '../data/demoData'
import { canEditTask, isProjectManagerLike } from '../lib/permissions'

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(dateInput) {
  if (!dateInput) return 'No due date'
  return new Date(dateInput).toLocaleDateString()
}

export default function BoardScreen() {
  const {
    users,
    projects,
    tasks,
    comments,
    currentUser,
    activeProject,
    activeProjectRole,
    hasRemoteSession,
    backendMode,
    isBootstrapping,
    isSyncing,
    lastError,
    clearError,
    logout,
    setActiveProject,
    createProject,
    addUser,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
  } = useTaskManager()

  const [filters, setFilters] = useState({ search: '', assigneeId: 'all', priority: 'all' })
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'member' })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: currentUser?.id ?? '',
    priority: 'medium',
    status: 'backlog',
    dueDate: '',
  })
  const [commentText, setCommentText] = useState('')

  const isManagerLike = isProjectManagerLike(currentUser, activeProjectRole)
  const hasProjectAccess = currentUser?.role === 'admin' || Boolean(activeProjectRole)

  const memberUsers = useMemo(() => {
    if (!activeProject) return []
    return activeProject.members
      .map((member) => users.find((user) => user.id === member.userId))
      .filter(Boolean)
  }, [activeProject, users])

  const projectTasks = useMemo(() => {
    if (!activeProject) return []

    return tasks.filter((task) => {
      if (task.projectId !== activeProject.id) return false

      const matchSearch =
        filters.search.length === 0 ||
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase())
      const matchAssignee = filters.assigneeId === 'all' || task.assigneeId === filters.assigneeId
      const matchPriority = filters.priority === 'all' || task.priority === filters.priority

      return matchSearch && matchAssignee && matchPriority
    })
  }, [tasks, activeProject, filters])

  const selectedTask = projectTasks.find((task) => task.id === selectedTaskId) ?? null
  const selectedTaskComments = comments.filter((comment) => comment.taskId === selectedTaskId)

  const canCreateTasks = hasProjectAccess
  const canUseProtectedActions = backendMode === 'local' || hasRemoteSession
  const canCreateProjects = isManagerLike && canUseProtectedActions
  const canCreateTaskItems = canCreateTasks && canUseProtectedActions
  const canManageUsers = currentUser?.role === 'admin' && canUseProtectedActions

  async function handleCreateProject(event) {
    event.preventDefault()
    const trimmedName = projectForm.name.trim()

    if (!trimmedName || !currentUser || !canCreateProjects) return

    try {
      await createProject({
        name: trimmedName,
        description: projectForm.description.trim(),
        memberIds: [currentUser.id],
        createdBy: currentUser.id,
      })
      setProjectForm({ name: '', description: '' })
    } catch {
      // Shared context error banner handles feedback.
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault()

    if (!activeProject || !currentUser || !canCreateTaskItems || !taskForm.title.trim()) return

    try {
      await createTask({
        projectId: activeProject.id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: taskForm.status,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || currentUser.id,
        creatorId: currentUser.id,
        dueDate: taskForm.dueDate,
      })

      setTaskForm({
        title: '',
        description: '',
        assigneeId: currentUser.id,
        priority: 'medium',
        status: 'backlog',
        dueDate: '',
      })
    } catch {
      // Shared context error banner handles feedback.
    }
  }

  async function handleAddUser(event) {
    event.preventDefault()

    const trimmedName = userForm.name.trim()
    const trimmedEmail = userForm.email.trim().toLowerCase()

    if (!canManageUsers || !trimmedName || !trimmedEmail) return

    try {
      await addUser({
        name: trimmedName,
        email: trimmedEmail,
        role: userForm.role,
      })

      setUserForm({ name: '', email: '', role: 'member' })
    } catch {
      // Shared context error banner handles feedback.
    }
  }

  async function handleDeleteTask(task) {
    if (!canUseProtectedActions || !hasProjectAccess) return
    if (!canEditTask(currentUser, activeProjectRole, task)) return

    try {
      await deleteTask(task.id)
      if (selectedTaskId === task.id) setSelectedTaskId(null)
    } catch {
      // Shared context error banner handles feedback.
    }
  }

  async function handleAddComment(event) {
    event.preventDefault()
    if (!selectedTask || !currentUser || !hasProjectAccess || !canUseProtectedActions || !commentText.trim()) return

    try {
      await addComment({
        taskId: selectedTask.id,
        authorId: currentUser.id,
        body: commentText.trim(),
      })
      setCommentText('')
    } catch {
      // Shared context error banner handles feedback.
    }
  }

  return (
    <main className="min-h-screen bg-brand-950 px-4 py-6 text-brand-100 md:px-6">
      <section className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[280px,1fr,320px]">
        <aside className="rounded-2xl border border-brand-700 bg-brand-900/70 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-400">Signed in as</p>
              <p className="font-heading text-xl text-white">{currentUser?.name}</p>
              <p className="text-sm text-brand-300">Role: {currentUser?.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-brand-600 px-3 py-1 text-xs uppercase tracking-wider text-brand-200 hover:border-brand-400 hover:text-white"
            >
              Logout
            </button>
          </div>

          <h2 className="font-heading text-xl text-white">Projects</h2>
          <div className="mt-3 space-y-2">
            {projects.map((project) => {
              const active = activeProject?.id === project.id
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project.id)
                    setSelectedTaskId(null)
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-brand-400 bg-brand-700/60 text-white'
                      : 'border-brand-700 bg-brand-900 text-brand-200 hover:border-brand-500'
                  }`}
                >
                  <p className="font-medium">{project.name}</p>
                  <p className="line-clamp-1 text-xs text-brand-300">{project.description}</p>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleCreateProject} className="mt-5 space-y-2">
            <h3 className="font-heading text-lg text-white">Create Project</h3>
            <input
              value={projectForm.name}
              onChange={(event) =>
                setProjectForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-white outline-none ring-brand-300 focus:ring"
              placeholder="Project name"
              disabled={!canCreateProjects}
            />
            <textarea
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-[90px] w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-white outline-none ring-brand-300 focus:ring"
              placeholder="Short description"
              disabled={!canCreateProjects}
            />
            <button
              type="submit"
              disabled={!canCreateProjects}
              className="w-full rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-brand-700"
            >
              Add Project
            </button>
            {!isManagerLike && (
              <p className="text-xs text-amber-300">Only admin or manager can create projects.</p>
            )}
            {!canUseProtectedActions && (
              <p className="text-xs text-amber-300">Session is not active. Login again to continue.</p>
            )}
          </form>

          <form onSubmit={handleAddUser} className="mt-5 space-y-2">
            <h3 className="font-heading text-lg text-white">Admin: Add User</h3>
            <input
              value={userForm.name}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-white outline-none ring-brand-300 focus:ring"
              placeholder="Full name"
              disabled={!canManageUsers}
            />
            <input
              value={userForm.email}
              type="email"
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-white outline-none ring-brand-300 focus:ring"
              placeholder="Email"
              disabled={!canManageUsers}
            />
            <select
              value={userForm.role}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, role: event.target.value }))
              }
              className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
              disabled={!canManageUsers}
            >
              <option value="member">member</option>
              <option value="manager">manager</option>
            </select>
            <button
              type="submit"
              disabled={!canManageUsers}
              className="w-full rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-brand-700"
            >
              Add User
            </button>
            {!canManageUsers && (
              <p className="text-xs text-amber-300">Only admin can add member or manager users.</p>
            )}
          </form>
        </aside>

        <section className="rounded-2xl border border-brand-700 bg-brand-900/70 p-4 backdrop-blur-sm">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <h1 className="font-heading text-2xl text-white md:text-3xl">{activeProject?.name}</h1>
              <p className="text-sm text-brand-300">{activeProject?.description}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-400">
                Backend: {backendMode} {isBootstrapping ? ' | loading' : ''}
              </p>
            </div>

            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="ml-auto min-w-[220px] rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-white outline-none ring-brand-300 focus:ring"
              placeholder="Search tasks"
            />

            <select
              value={filters.assigneeId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, assigneeId: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
            >
              <option value="all">All assignees</option>
              {memberUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, priority: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
            >
              <option value="all">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {lastError && (
            <div className="mb-3 rounded-lg border border-rose-400/60 bg-rose-500/10 p-2 text-sm text-rose-200">
              <p>{lastError}</p>
              <button
                onClick={clearError}
                className="mt-1 text-xs uppercase tracking-wider text-rose-100 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {isSyncing && (
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-brand-300">
              Syncing changes with backend...
            </p>
          )}

          <form onSubmit={handleCreateTask} className="mb-5 grid gap-2 rounded-xl border border-brand-700 bg-brand-950/60 p-3 md:grid-cols-6">
            <input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Task title"
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm md:col-span-2"
              disabled={!canCreateTaskItems}
            />
            <input
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm md:col-span-2"
              disabled={!canCreateTaskItems}
            />
            <select
              value={taskForm.assigneeId}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, assigneeId: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
              disabled={!canCreateTaskItems}
            >
              {memberUsers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, priority: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
              disabled={!canCreateTaskItems}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select
              value={taskForm.status}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, status: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
              disabled={!canCreateTaskItems}
            >
              {STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
            <input
              value={taskForm.dueDate}
              type="date"
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
              }
              className="rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
              disabled={!canCreateTaskItems}
            />
            <button
              type="submit"
              disabled={!canCreateTaskItems}
              className="rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-brand-700"
            >
              Create Task
            </button>
          </form>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((column) => (
              <article key={column.id} className="rounded-xl border border-brand-700 bg-brand-950/65 p-3">
                <h3 className="font-heading text-lg text-white">{column.label}</h3>
                <div className="mt-2 space-y-2">
                  {projectTasks
                    .filter((task) => task.status === column.id)
                    .map((task) => {
                      const assignee = users.find((user) => user.id === task.assigneeId)
                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            selectedTaskId === task.id
                              ? 'border-brand-300 bg-brand-700/70'
                              : 'border-brand-700 bg-brand-900 hover:border-brand-500'
                          }`}
                        >
                          <p className="font-medium text-white">{task.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-brand-300">{task.description}</p>
                          <div className="mt-3 flex items-center justify-between text-xs text-brand-300">
                            <span className="rounded bg-brand-700 px-2 py-0.5 uppercase">{task.priority}</span>
                            <span>{assignee?.name ?? 'Unassigned'}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-brand-400">Due: {formatDate(task.dueDate)}</p>
                        </button>
                      )
                    })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-brand-700 bg-brand-900/70 p-4 backdrop-blur-sm">
          <h2 className="font-heading text-xl text-white">Task Details</h2>

          {!selectedTask && <p className="mt-2 text-sm text-brand-300">Pick a task card to view details and comments.</p>}

          {selectedTask && (
            <>
              <div className="mt-3 rounded-xl border border-brand-700 bg-brand-950/70 p-3">
                <p className="font-medium text-white">{selectedTask.title}</p>
                <p className="mt-1 text-sm text-brand-300">{selectedTask.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-brand-300">
                  <p>Status</p>
                  <select
                    value={selectedTask.status}
                    onChange={async (event) => {
                      if (!canUseProtectedActions || !hasProjectAccess) return
                      try {
                        await updateTask(selectedTask.id, { status: event.target.value })
                      } catch {
                        // Shared context error banner handles feedback.
                      }
                    }}
                    className="rounded-md border border-brand-700 bg-brand-950 px-2 py-1"
                    disabled={!canUseProtectedActions || !hasProjectAccess}
                  >
                    {STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <p>Priority</p>
                  <select
                    value={selectedTask.priority}
                    onChange={async (event) => {
                      if (!canUseProtectedActions || !hasProjectAccess) return
                      try {
                        await updateTask(selectedTask.id, { priority: event.target.value })
                      } catch {
                        // Shared context error banner handles feedback.
                      }
                    }}
                    className="rounded-md border border-brand-700 bg-brand-950 px-2 py-1"
                    disabled={!canUseProtectedActions || !hasProjectAccess}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleDeleteTask(selectedTask)}
                  disabled={!canUseProtectedActions || !hasProjectAccess || !canEditTask(currentUser, activeProjectRole, selectedTask)}
                  className="mt-4 w-full rounded-lg border border-rose-500/70 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:border-brand-700 disabled:text-brand-500"
                >
                  Delete Task
                </button>
              </div>

              <form onSubmit={handleAddComment} className="mt-4">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Write a comment"
                  className="min-h-[90px] w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm"
                  disabled={!canUseProtectedActions || !hasProjectAccess}
                />
                <button
                  type="submit"
                  disabled={!canUseProtectedActions || !hasProjectAccess}
                  className="mt-2 w-full rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-400"
                >
                  Add Comment
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {selectedTaskComments.map((comment) => {
                  const author = users.find((user) => user.id === comment.authorId)
                  const canDeleteComment =
                    currentUser?.role === 'admin' || comment.authorId === currentUser?.id

                  return (
                    <article key={comment.id} className="rounded-lg border border-brand-700 bg-brand-950/70 p-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-brand-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[10px] text-brand-100">
                            {author ? initials(author.name) : 'NA'}
                          </span>
                          {author?.name ?? 'Unknown'}
                        </span>
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-brand-200">{comment.body}</p>
                      <button
                        onClick={async () => {
                          if (!canUseProtectedActions || !hasProjectAccess) return
                          try {
                            await deleteComment(comment.id)
                          } catch {
                            // Shared context error banner handles feedback.
                          }
                        }}
                        disabled={!canUseProtectedActions || !hasProjectAccess || !canDeleteComment}
                        className="mt-2 text-xs text-rose-300 hover:text-rose-200 disabled:text-brand-500"
                      >
                        Delete
                      </button>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}
