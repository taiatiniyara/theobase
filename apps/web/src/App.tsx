import { useEffect, useState } from 'react'
import { CountEntryForm } from './features/counts/CountEntryForm'
import { MissionExceptionsTab } from './features/missions/MissionExceptionsTab'
import { ReconciliationDetail } from './features/reconciliations/ReconciliationDetail'
import { SyncStatusIndicator } from './features/sync/SyncStatusIndicator'
import { syncPendingCounts } from './lib/sync'

type Screen = { name: 'count-entry' } | { name: 'reconciliation'; countId: number } | { name: 'exceptions' }

// Provisional, query-param-based navigation: ?count=<id> opens that
// count's reconciliation detail screen (#15), ?exceptions=1 opens the
// Mission exceptions tab (#16), otherwise the app shows the
// count-entry screen as before. There's no real navigation shell yet —
// the role-based home screens that would link into these (#17
// Treasurer, #18 Clerk, #19 Pastor, #20 Mission) are separate,
// not-yet-built tickets — so this is only enough to make each screen
// reachable at all until one of those replaces it.
function screenFromLocation(): Screen {
  const params = new URLSearchParams(window.location.search)
  if (params.has('exceptions')) {
    return { name: 'exceptions' }
  }
  const raw = params.get('count')
  const parsed = raw ? Number(raw) : null
  if (parsed && Number.isInteger(parsed) && parsed > 0) {
    return { name: 'reconciliation', countId: parsed }
  }
  return { name: 'count-entry' }
}

function useScreen(): Screen {
  const [screen, setScreen] = useState<Screen>(screenFromLocation)
  useEffect(() => {
    const onPopState = () => setScreen(screenFromLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  return screen
}

function App() {
  const screen = useScreen()

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
      {screen.name === 'count-entry' && (
        <>
          <SyncStatusIndicator />
          <CountEntryForm />
        </>
      )}
      {screen.name === 'reconciliation' && <ReconciliationDetail countId={screen.countId} />}
      {screen.name === 'exceptions' && <MissionExceptionsTab />}
    </main>
  )
}

export default App
