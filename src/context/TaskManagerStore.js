import { createContext, useContext } from 'react'

export const TaskManagerContext = createContext(null)

export function useTaskManager() {
  const context = useContext(TaskManagerContext)

  if (!context) {
    throw new Error('useTaskManager must be used inside TaskManagerProvider')
  }

  return context
}
