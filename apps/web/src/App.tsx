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
    <main>
      <h1>Theobase</h1>
      <p>Scaffolding check — this page is replaced once product screens land.</p>
      <ul>
        <li>Local-first storage: {storageReady === null ? 'checking…' : storageReady ? 'ready' : 'failed'}</li>
        <li>API: {apiStatus}</li>
      </ul>
    </main>
  )
}

export default App
