import { listPending } from './db'

export interface SyncStatus {
  pendingCount: number
  stuck: boolean
  stuckReason: string | null
}

// How long a record can sit pending *while the browser reports being
// online* before it's treated as stuck rather than "still trying."
// Deliberately short — a few minutes, not days — because the whole
// point of distinguishing on navigator.onLine (see below) rather than
// pure elapsed time is that "just offline" already gets an unlimited
// pass regardless of this constant. This only fires for the case that
// actually deserves promptness: sync is apparently possible but isn't
// working.
const ONLINE_GRACE_PERIOD_MS = 2 * 60 * 1000

// Deliberately not a fixed "N days" timer — see CONTEXT.md's
// requirement that arbitrarily long offline periods are normal, not a
// warning. A record can sit pending for weeks with zero alarm as long
// as the browser is actually offline the whole time; what's genuinely
// worth surfacing is either (a) the server explicitly rejected it
// (will never succeed on retry, regardless of how long it's been), or
// (b) the browser believes it has connectivity but syncing still isn't
// happening after a short grace period (something's actually broken).
export async function getSyncStatus(): Promise<SyncStatus> {
  const pending = await listPending()

  if (pending.length === 0) {
    return { pendingCount: 0, stuck: false, stuckReason: null }
  }

  const rejected = pending.find((r) => r.lastError?.type === 'rejected')
  if (rejected) {
    return {
      pendingCount: pending.length,
      stuck: true,
      stuckReason: `A record was rejected: ${rejected.lastError?.message}`,
    }
  }

  if (navigator.onLine) {
    const overdue = pending.find((r) => {
      const anchor = r.lastAttemptAt ?? r.createdAt
      return Date.now() - new Date(anchor).getTime() > ONLINE_GRACE_PERIOD_MS
    })
    if (overdue) {
      return {
        pendingCount: pending.length,
        stuck: true,
        stuckReason: 'Still trying to sync — this is taking longer than expected.',
      }
    }
  }

  return { pendingCount: pending.length, stuck: false, stuckReason: null }
}
