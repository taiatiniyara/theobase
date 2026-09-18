import { useEffect } from 'react'
import { CountEntryForm } from './features/counts/CountEntryForm'
import { syncPendingCounts } from './lib/sync'

function App() {
  useEffect(() => {
    // "Syncs opportunistically": not just right after a fresh submit
    // (CountEntryForm already does that), but whenever the app opens
    // with connectivity — a count saved during a previous, now-closed
    // offline session still needs a chance to sync.
    void syncPendingCounts()
    window.addEventListener('online', syncPendingCounts)
    return () => window.removeEventListener('online', syncPendingCounts)
  }, [])

  return (
    <main className="mx-auto max-w-md">
      <h1 className="text-brand dark:text-brand-light px-4 pt-6 text-2xl font-semibold">
        Theobase
      </h1>
      <CountEntryForm />
    </main>
  )
}

export default App
