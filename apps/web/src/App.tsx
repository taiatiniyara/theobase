import { useEffect, useState } from 'react'
import { ClerkHome } from './features/clerk/ClerkHome'
import { MissionExceptionsTab } from './features/missions/MissionExceptionsTab'
import { PastorHome } from './features/pastor/PastorHome'
import { PastorRemovalApprovals } from './features/pastor/PastorRemovalApprovals'
import { ReconciliationDetail } from './features/reconciliations/ReconciliationDetail'
import { TreasurerHome } from './features/treasurer/TreasurerHome'
import { syncPendingCounts } from './lib/sync'

type Screen =
  | { name: 'home' }
  | { name: 'reconciliation'; countId: number }
  | { name: 'exceptions' }
  | { name: 'clerk' }
  | { name: 'pastor' }
  | { name: 'pastor-approvals' }

// Provisional, query-param-based navigation: ?count=<id> opens that
// count's reconciliation detail screen (#15), ?exceptions=1 opens the
// Mission exceptions tab (#16), ?clerk=1 opens the Clerk landing
// screen (#18), ?pastor=1 opens the Pastor's district roster home
// screen (#19), ?pastor-approvals=1 opens the Pastor's removal-request
// approvals (#18's async sign-off flow, linked from the pastor home
// screen's attention card), otherwise the app shows the Treasurer home
// screen (#17). There's no real role-based navigation shell yet — that's
// #20 (Mission roster) and #24 (login screen), neither built yet — so
// this is only enough to make each screen reachable at all until one
// of those replaces it.
function screenFromLocation(): Screen {
  const params = new URLSearchParams(window.location.search)
  if (params.has('exceptions')) {
    return { name: 'exceptions' }
  }
  if (params.has('clerk')) {
    return { name: 'clerk' }
  }
  if (params.has('pastor-approvals')) {
    return { name: 'pastor-approvals' }
  }
  if (params.has('pastor')) {
    return { name: 'pastor' }
  }
  const raw = params.get('count')
  const parsed = raw ? Number(raw) : null
  if (parsed && Number.isInteger(parsed) && parsed > 0) {
    return { name: 'reconciliation', countId: parsed }
  }
  return { name: 'home' }
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
      {screen.name === 'home' && <TreasurerHome />}
      {screen.name === 'reconciliation' && <ReconciliationDetail countId={screen.countId} />}
      {screen.name === 'exceptions' && <MissionExceptionsTab />}
      {screen.name === 'clerk' && <ClerkHome />}
      {screen.name === 'pastor' && <PastorHome />}
      {screen.name === 'pastor-approvals' && <PastorRemovalApprovals />}
    </main>
  )
}

export default App
