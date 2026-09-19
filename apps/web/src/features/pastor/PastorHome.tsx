import { useEffect, useState } from 'react'
import { RecordStatusBadge } from '../churches/RecordStatusBadge'
import { type DistrictChurchStatus, fetchDistrictRoster } from '../../lib/districts'
import { fetchPendingRemovalRequests } from '../../lib/localAccounts'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function ChurchRow({ church }: { church: DistrictChurchStatus }) {
  const flags: string[] = []
  if (church.missingCount) flags.push('Missing count')
  if (church.hasStuckReconciliation) flags.push('Stuck')

  return (
    <li>
      <a
        href={church.latestRecord ? `?count=${church.latestRecord.countId}` : undefined}
        className={`flex items-center justify-between rounded-lg border border-neutral-200 p-3 ${church.latestRecord ? 'hover:bg-neutral-50' : 'pointer-events-none opacity-60'}`}
      >
        <span className="flex flex-col">
          <span className="font-medium">{church.churchName}</span>
          {flags.length > 0 && <span className="text-sm text-red-700">{flags.join(' · ')}</span>}
          {church.latestRecord === null && <span className="text-sm text-neutral-500">No records yet</span>}
        </span>
        {church.latestRecord && <RecordStatusBadge record={church.latestRecord} />}
      </a>
    </li>
  )
}

// The Pastor's home screen — see CONTEXT.md > UI/UX > District-level
// roles: "a district-wide roster of all churches in their district
// (status badges, same pattern as the Mission roster, just scoped
// smaller)." Reuses #16's exception computation (missing count / stuck
// reconciliation), scoped to one district instead of a whole Mission —
// the Mission roster itself is #20, not yet built.
//
// The pending account-removal requests (#18's async Pastor sign-off
// flow) surface here as a summary attention card linking to the full
// review screen (?pastor-approvals=1), rather than duplicating that
// UI inline — the same "skip straight to what needs attention" pattern
// #17 established for the Treasurer's discrepancy cards.
export function PastorHome() {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [roster, setRoster] = useState<DistrictChurchStatus[] | null>(null)
  const [pendingRemovalCount, setPendingRemovalCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const acc = await getCurrentAccount()
        setAccount(acc)
        if (acc?.accountType === 'local' && acc.role === 'pastor') {
          const [{ roster }, { requests }] = await Promise.all([fetchDistrictRoster(), fetchPendingRemovalRequests()])
          setRoster(roster)
          setPendingRemovalCount(requests.length)
        }
      } catch (err) {
        setError(errorMessage(err))
      }
    }
    void load()
  }, [])

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>
  }
  if (account === undefined) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (account === null) {
    return <p className="p-4 text-sm text-neutral-600">Log in to view this.</p>
  }
  if (account.accountType !== 'local' || account.role !== 'pastor') {
    return <p className="p-4 text-sm text-neutral-600">This screen is for Pastor accounts.</p>
  }
  if (roster === null) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {pendingRemovalCount !== null && pendingRemovalCount > 0 && (
        <a href="?pastor-approvals=1" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {pendingRemovalCount} pending account removal {pendingRemovalCount === 1 ? 'request' : 'requests'} — tap
          to review
        </a>
      )}

      <h2 className="text-xl font-semibold">District roster</h2>
      {roster.length === 0 ? (
        <p className="text-sm text-neutral-500">No churches in this district yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {roster.map((church) => (
            <ChurchRow key={church.churchId} church={church} />
          ))}
        </ul>
      )}
    </div>
  )
}
