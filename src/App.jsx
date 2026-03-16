import BoardScreen from './components/BoardScreen'
import LoginScreen from './components/LoginScreen'
import { TaskManagerProvider } from './context/TaskManagerContext'
import { useTaskManager } from './context/TaskManagerStore'

function AppContent() {
  const { currentUser } = useTaskManager()

  return currentUser ? <BoardScreen /> : <LoginScreen />
}

function App() {
  return (
    <TaskManagerProvider>
      <AppContent />
    </TaskManagerProvider>
  )
}

export default App
