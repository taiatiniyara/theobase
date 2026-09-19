import { useCallback, useEffect, useState } from 'react'
import {
  addReconciliationComment,
  confirmDiscrepancyResolution,
  fetchReconciliationByCount,
  markReconciliationReceived,
  markReconciliationSent,
  proposeDiscrepancyResolution,
  type ReconciliationDetail as ReconciliationDetailData,
  type ReconciliationStatus,
} from '../../lib/reconciliations'
import { type CurrentAccount, getCurrentAccount } from '../../lib/session'

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function centsFromInput(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

const STEPS: { key: ReconciliationStatus; label: string }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'received', label: 'Received' },
]

// The single-record view behind the compact status chips shown
// elsewhere (list views, a later ticket) — see CONTEXT.md > UI/UX >
// Reconciliation detail screen. Visible to, and driven by, both
// audiences on the *same* screen: the originating local church
// (Treasurer/Clerk/Pastor) and Mission (Admin/Staff) each see the full
// lifecycle and the same discrepancy thread, just with different
// actions available at each stage — matching the transparency premise
// rather than a Mission-only surveillance view.
function Stepper({ reconciliation }: { reconciliation: ReconciliationDetailData['reconciliation'] }) {
  const currentIndex = STEPS.findIndex((s) => s.key === reconciliation.status)

  let outcomeLabel = 'Discrepancy check'
  let outcomeClass = 'bg-neutral-200 text-neutral-500'
  if (reconciliation.status === 'received') {
    if (!reconciliation.hasDiscrepancy) {
      outcomeLabel = 'No discrepancy'
      outcomeClass = 'bg-green-600 text-white'
    } else if (reconciliation.discrepancyResolvedAt) {
      outcomeLabel = 'Discrepancy resolved'
      outcomeClass = 'bg-amber-600 text-white'
    } else {
      outcomeLabel = 'Discrepancy flagged'
      outcomeClass = 'bg-red-600 text-white'
    }
  }

  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => (
        <li
          key={step.key}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            i <= currentIndex ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-500'
          }`}
        >
          {step.label}
        </li>
      ))}
      <li className={`rounded-full px-3 py-1 text-sm font-medium ${outcomeClass}`}>{outcomeLabel}</li>
    </ol>
  )
}

export function ReconciliationDetail({ countId }: { countId: number }) {
  const [account, setAccount] = useState<CurrentAccount | null | undefined>(undefined)
  const [detail, setDetail] = useState<ReconciliationDetailData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [courierName, setCourierName] = useState('')
  const [receivedAmounts, setReceivedAmounts] = useState<Record<number, string>>({})
  const [resolutionReason, setResolutionReason] = useState('')
  const [commentBody, setCommentBody] = useState('')

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const [acc, det] = await Promise.all([getCurrentAccount(), fetchReconciliationByCount(countId)])
      setAccount(acc)
      setDetail(det)
    } catch (err) {
      setLoadError(errorMessage(err))
    }
  }, [countId])

  useEffect(() => {
    void load()
  }, [load])

  if (loadError) {
    return <p className="p-4 text-sm text-red-700">{loadError}</p>
  }
  if (account === undefined || detail === null) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (account === null) {
    return <p className="p-4 text-sm text-neutral-600">Log in to view this record.</p>
  }

  const { reconciliation, submittedLines, receivedLines, comments } = detail
  const isLocalActor = account.accountType === 'local'
  const isMissionActor =
    account.accountType === 'institutional' && (account.role === 'mission_admin' || account.role === 'mission_staff')

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      await load()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleMarkSent(e: React.FormEvent) {
    e.preventDefault()
    void runAction(() => markReconciliationSent(reconciliation.id, courierName.trim() || null))
  }

  function handleMarkReceived(e: React.FormEvent) {
    e.preventDefault()
    const lines = submittedLines.map((line) => ({
      fundCategoryId: line.fundCategoryId,
      amountCents: centsFromInput(receivedAmounts[line.fundCategoryId] ?? ''),
    }))
    void runAction(() => markReconciliationReceived(reconciliation.id, lines))
  }

  function handleProposeResolution(e: React.FormEvent) {
    e.preventDefault()
    void runAction(async () => {
      await proposeDiscrepancyResolution(reconciliation.id, resolutionReason)
      setResolutionReason('')
    })
  }

  function handleConfirmResolution() {
    void runAction(() => confirmDiscrepancyResolution(reconciliation.id))
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    void runAction(async () => {
      await addReconciliationComment(reconciliation.id, commentBody)
      setCommentBody('')
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-16">
      <Stepper reconciliation={reconciliation} />

      {reconciliation.courierName && (
        <p className="text-sm text-neutral-600">Courier: {reconciliation.courierName}</p>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-neutral-500">
            <th className="py-1 font-medium">Category</th>
            <th className="py-1 font-medium">Submitted</th>
            <th className="py-1 font-medium">Received</th>
          </tr>
        </thead>
        <tbody>
          {submittedLines.map((line) => {
            const received = receivedLines.find((r) => r.fundCategoryId === line.fundCategoryId)
            const mismatch = received !== undefined && received.receivedAmountCents !== line.amountCents
            return (
              <tr key={line.fundCategoryId} className={mismatch ? 'bg-red-50' : undefined}>
                <td className="py-1">{line.categoryName}</td>
                <td className="py-1 tabular-nums">${formatCents(line.amountCents)}</td>
                <td className="py-1 tabular-nums">{received ? `$${formatCents(received.receivedAmountCents)}` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {actionError && <p className="text-sm text-red-700">{actionError}</p>}

      {isLocalActor && reconciliation.status === 'submitted' && (
        <form onSubmit={handleMarkSent} className="flex flex-col gap-2 rounded-lg border border-neutral-300 p-4">
          <h3 className="text-base font-semibold">Mark as sent</h3>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Courier name (optional)</span>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="rounded-lg border border-neutral-300 p-2"
            />
          </label>
          <button type="submit" disabled={busy} className="bg-brand rounded-lg p-3 font-semibold text-white disabled:opacity-50">
            Mark as sent
          </button>
        </form>
      )}

      {isMissionActor && reconciliation.status === 'in_transit' && (
        <form
          onSubmit={handleMarkReceived}
          className="flex flex-col gap-2 rounded-lg border border-neutral-300 p-4"
        >
          <h3 className="text-base font-semibold">Record amount received</h3>
          {submittedLines.map((line) => (
            <label key={line.fundCategoryId} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-neutral-700">{line.categoryName}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={receivedAmounts[line.fundCategoryId] ?? ''}
                onChange={(e) =>
                  setReceivedAmounts((prev) => ({ ...prev, [line.fundCategoryId]: e.target.value }))
                }
                className="rounded-lg border border-neutral-300 p-2"
              />
            </label>
          ))}
          <button type="submit" disabled={busy} className="bg-brand rounded-lg p-3 font-semibold text-white disabled:opacity-50">
            Record amount received
          </button>
        </form>
      )}

      {reconciliation.hasDiscrepancy && isMissionActor && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-400 bg-amber-50 p-4">
          <h3 className="text-base font-semibold">Discrepancy resolution</h3>
          {reconciliation.discrepancyResolvedAt ? (
            <p className="text-sm text-neutral-700">
              Resolved. Reason: {reconciliation.discrepancyProposedReason}
            </p>
          ) : reconciliation.discrepancyProposedByAccountId === null ? (
            <form onSubmit={handleProposeResolution} className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">
                  Reason (counting error, in-transit loss, etc.)
                </span>
                <textarea
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  className="rounded-lg border border-neutral-300 p-2"
                  required
                />
              </label>
              <button type="submit" disabled={busy} className="bg-brand rounded-lg p-3 font-semibold text-white disabled:opacity-50">
                Propose resolution
              </button>
            </form>
          ) : reconciliation.discrepancyProposedByAccountId === account.id ? (
            <p className="text-sm text-neutral-700">
              Waiting for a second Mission staff member to confirm your proposed resolution: "
              {reconciliation.discrepancyProposedReason}"
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-700">
                Proposed resolution: "{reconciliation.discrepancyProposedReason}"
              </p>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={busy}
                className="bg-brand rounded-lg p-3 font-semibold text-white disabled:opacity-50"
              >
                Confirm resolution
              </button>
            </div>
          )}
        </div>
      )}

      {reconciliation.hasDiscrepancy && (
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">Discrepancy discussion</h3>
          <ul className="flex flex-col gap-2">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg bg-neutral-100 p-2 text-sm">
                <span className="font-medium">{comment.authorDisplayName}</span>: {comment.body}
              </li>
            ))}
            {comments.length === 0 && <li className="text-sm text-neutral-500">No comments yet.</li>}
          </ul>
          {isLocalActor && (
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="e.g. We recounted, our figure was correct"
                className="rounded-lg border border-neutral-300 p-2"
                required
              />
              <button type="submit" disabled={busy} className="bg-brand self-start rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50">
                Add comment
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
