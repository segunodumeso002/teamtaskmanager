export function isProjectManagerLike(user, projectRole) {
  return user?.role === 'admin' || user?.role === 'manager' || projectRole === 'manager'
}

export function canEditTask(user, projectRole, task) {
  return (
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    projectRole === 'manager' ||
    (user && task && task.creatorId === user.id)
  )
}
