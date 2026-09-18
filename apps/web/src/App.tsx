import { useEffect, useState } from 'react'
import { pendingCount } from './lib/db'

// Scaffolding smoke test only — confirms the PWA shell, local-first
// storage, and API are wired up. Product screens land in later tickets.
function App() {
  const [storageReady, setStorageReady] = useState<boolean | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'unreachable'>('checking')

  useEffect(() => {
    pendingCount()
      .then(() => setStorageReady(true))
      .catch(() => setStorageReady(false))
  }, [])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
    fetch(`${apiUrl}/health`)
      .then((res) => setApiStatus(res.ok ? 'ok' : 'unreachable'))
      .catch(() => setApiStatus('unreachable'))
  }, [])

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-brand dark:text-brand-light text-2xl font-semibold">Theobase</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Scaffolding check — this page is replaced once product screens land.
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        <li>Local-first storage: {storageReady === null ? 'checking…' : storageReady ? 'ready' : 'failed'}</li>
        <li>API: {apiStatus}</li>
      </ul>
    </main>
  )
}

export default App
