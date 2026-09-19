import { useEffect, useState } from 'react'
import { CountEntryForm } from './features/counts/CountEntryForm'
import { ReconciliationDetail } from './features/reconciliations/ReconciliationDetail'
import { SyncStatusIndicator } from './features/sync/SyncStatusIndicator'
import { syncPendingCounts } from './lib/sync'

// Provisional, query-param-based navigation: ?count=<id> opens that
// count's reconciliation detail screen (#15), otherwise the app shows
// the count-entry screen as before. There's no real navigation shell
// yet — the role-based home screens that would link into this (#17
// Treasurer, #18 Clerk, #19 Pastor, #20 Mission) are separate,
// not-yet-built tickets — so this is only enough to make the detail
// screen reachable at all until one of those replaces it.
function useReconciliationCountId(): number | null {
  const [countId, setCountId] = useState<number | null>(() => {
    const raw = new URLSearchParams(window.location.search).get('count')
    const parsed = raw ? Number(raw) : null
    return parsed && Number.isInteger(parsed) && parsed > 0 ? parsed : null
  })
  useEffect(() => {
    const onPopState = () => {
      const raw = new URLSearchParams(window.location.search).get('count')
      const parsed = raw ? Number(raw) : null
      setCountId(parsed && Number.isInteger(parsed) && parsed > 0 ? parsed : null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  return countId
}

function App() {
  const reconciliationCountId = useReconciliationCountId()

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
      {reconciliationCountId === null ? (
        <>
          <SyncStatusIndicator />
          <CountEntryForm />
        </>
      ) : (
        <ReconciliationDetail countId={reconciliationCountId} />
      )}
    </main>
  )
}

export default App
