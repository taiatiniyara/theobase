import { useEffect, useState } from 'react'
import { OUTBOX_CHANGED_EVENT } from '../../lib/db'
import { getSyncStatus, type SyncStatus } from '../../lib/syncStatus'

// A short interval poll as a safety net for the one thing that no
// event fires for: simply enough time passing while online for a
// pending record to cross the "stuck" threshold with no new save or
// sync attempt happening in between.
const POLL_INTERVAL_MS = 15_000

const EMPTY_STATUS: SyncStatus = { pendingCount: 0, stuck: false, stuckReason: null }

// Per CONTEXT.md > UI/UX > Offline/sync UX: calm and always-present
// when there's something pending, never alarming just because the
// device is offline — offline is the normal operating state here, not
// an error. Only escalates when something's actually wrong (see
// syncStatus.ts for exactly what "wrong" means).
export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(EMPTY_STATUS)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      getSyncStatus().then((s) => {
        if (!cancelled) setStatus(s)
      })
    }

    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    window.addEventListener(OUTBOX_CHANGED_EVENT, refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener(OUTBOX_CHANGED_EVENT, refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
    }
  }, [])

  if (status.pendingCount === 0) return null

  const label = `${status.pendingCount} record${status.pendingCount === 1 ? '' : 's'} saved, `

  if (status.stuck) {
    return (
      <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {label}having trouble syncing. {status.stuckReason}
      </div>
    )
  }

  return (
    <div role="status" className="border-b border-neutral-200 bg-neutral-100 px-4 py-2 text-sm text-neutral-700">
      {label}waiting to sync.
    </div>
  )
}
