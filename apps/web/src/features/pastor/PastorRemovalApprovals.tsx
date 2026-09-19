import { useEffect, useState } from 'react'
import {
  approveRemovalRequest,
  fetchPendingRemovalRequests,
  type PendingRemovalRequest,
  rejectRemovalRequest,
} from '../../lib/localAccounts'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function RequestCard({ request, onChanged }: { request: PendingRemovalRequest; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setBusy(true)
    setError(null)
    try {
      await approveRemovalRequest(request.id)
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await rejectRemovalRequest(request.id, reason)
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p>
        <span className="font-medium">{request.targetDisplayName}</span> ({request.targetRole}) at{' '}
        <span className="font-medium">{request.churchName}</span>
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {rejecting ? (
        <form onSubmit={handleReject} className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Reason for rejecting</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required className="rounded-lg border border-neutral-300 p-2" />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
              Confirm rejection
            </button>
            <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="rounded-lg px-4 py-2 text-neutral-600">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={handleApprove} disabled={busy} className="bg-brand rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50">
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

// The Pastor's side of #18's async removal sign-off flow — see
// CONTEXT.md: "passive only for MVP — the pending request shows as an
// attention card on the Pastor's oversight home screen ... seen next
// time they open the app." That home screen is #19 (not yet built),
// so this is reachable directly for now, the same provisional pattern
// as #16's exceptions tab before the Mission roster existed.
export function PastorRemovalApprovals() {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [requests, setRequests] = useState<PendingRemovalRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    getCurrentAccount()
      .then((acc) => {
        setAccount(acc)
        if (acc?.accountType === 'local' && acc.role === 'pastor') {
          return fetchPendingRemovalRequests().then(({ requests }) => setRequests(requests))
        }
      })
      .catch((err: unknown) => setError(errorMessage(err)))
  }

  useEffect(load, [])

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

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-semibold">Account removal requests</h2>
      {requests === null ? (
        <p className="text-sm text-neutral-600">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-neutral-500">No pending removal requests.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  )
}
