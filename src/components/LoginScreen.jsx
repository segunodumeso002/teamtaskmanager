import { useTaskManager } from '../context/TaskManagerStore'

export default function LoginScreen() {
  const { users, login, backendMode, isSyncing, lastError, clearError } = useTaskManager()

  async function handleLogin(userId) {
    try {
      await login(userId)
    } catch {
      // Error is surfaced in shared context state.
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-950 px-6 py-12 text-brand-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(53,88,236,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(62,180,137,0.25),transparent_35%)]" />

      <section className="relative mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-brand-700/50 bg-brand-900/70 p-8 shadow-2xl backdrop-blur-sm lg:flex-row">
        <div className="lg:w-1/2">
          <p className="mb-3 inline-block rounded-full border border-brand-600 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-300">
            Portfolio Project
          </p>
          <h1 className="font-heading text-4xl leading-tight text-white md:text-5xl">
            Team Task Manager
          </h1>
          <p className="mt-4 max-w-xl text-brand-200">
            A mini Jira/Trello app demonstrating authentication, role-based access,
            project and task CRUD, filtering, and collaboration comments.
          </p>
        </div>

        <div className="lg:w-1/2">
          <div className="rounded-2xl border border-brand-700 bg-brand-950/70 p-5">
            <h2 className="font-heading text-2xl text-white">Choose Demo Account</h2>
            <p className="mt-1 text-sm text-brand-300">
              Start with any role to test permission boundaries.
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-brand-400">
              Backend mode: {backendMode}
            </p>

            {lastError && (
              <div className="mt-3 rounded-lg border border-rose-400/60 bg-rose-500/10 p-2 text-xs text-rose-200">
                <p>{lastError}</p>
                <button
                  onClick={clearError}
                  className="mt-1 text-[11px] uppercase tracking-wider text-rose-100 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id)}
                  disabled={isSyncing}
                  className="group w-full rounded-xl border border-brand-700 bg-brand-900 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-800"
                >
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-brand-300">{user.email}</p>
                  <p className="mt-2 inline-block rounded-full bg-brand-700 px-3 py-0.5 text-xs uppercase tracking-wider text-brand-100 group-hover:bg-brand-500">
                    {user.role}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
