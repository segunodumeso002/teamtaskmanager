export const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

export const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export const demoState = {
  currentUserId: null,
  activeProjectId: 'p1',
  users: [
    { id: 'u1', name: 'Andrew Tierney', email: 'andrew@taskflow.dev', role: 'admin' },
    { id: 'u2', name: 'Ada Mensah', email: 'ada@taskflow.dev', role: 'manager' },
    { id: 'u3', name: 'Noah Owusu', email: 'noah@taskflow.dev', role: 'member' },
  ],
  projects: [
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
  ],
  tasks: [
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
    {
      id: 't2',
      projectId: 'p1',
      title: 'Setup auth flows',
      description: 'Login session handling and role-based guards.',
      status: 'backlog',
      priority: 'urgent',
      assigneeId: 'u2',
      creatorId: 'u1',
      dueDate: '2026-03-12',
      createdAt: '2026-03-09T10:06:00.000Z',
    },
    {
      id: 't3',
      projectId: 'p1',
      title: 'Prepare deployment pipeline',
      description: 'Document Netlify and AWS deployment checklist.',
      status: 'review',
      priority: 'medium',
      assigneeId: 'u1',
      creatorId: 'u2',
      dueDate: '2026-03-18',
      createdAt: '2026-03-09T10:07:00.000Z',
    },
  ],
  comments: [
    {
      id: 'c1',
      taskId: 't1',
      authorId: 'u2',
      body: 'Keep interactions smooth on mobile and desktop.',
      createdAt: '2026-03-09T10:20:00.000Z',
    },
  ],
}
