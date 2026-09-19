import { useEffect, useState } from 'react'
import { type ChurchRecord, fetchChurchRecords } from '../../lib/churches'

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

// Compact badges/chips, not the full 4-stage stepper — see CONTEXT.md >
// UI/UX > Reconciliation status display: the stepper only belongs on a
// single record's detail view (#15), a list needs to stay dense and
// scannable instead.
function StatusBadge({ record }: { record: ChurchRecord }) {
  if (record.status === 'submitted') {
    return <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Submitted</span>
  }
  if (record.status === 'in_transit') {
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">In Transit</span>
  }
  // status === 'received'
  if (!record.hasDiscrepancy) {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Received</span>
  }
  if (record.discrepancyResolvedAt) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Resolved</span>
  }
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Discrepancy</span>
}

// The shared oversight-view component CONTEXT.md calls for — reused
// by the Treasurer's history tab (#17) and, unmodified, by Clerk's
// landing screen (#18) rather than two separate builds. Shows every
// record for the church, not filtered to "entered by me".
export function ChurchRecordsView() {
  const [records, setRecords] = useState<ChurchRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChurchRecords()
      .then(({ records }) => setRecords(records))
      .catch((err: unknown) => setError(errorMessage(err)))
  }, [])

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>
  }
  if (records === null) {
    return <p className="p-4 text-sm text-neutral-600">Loading…</p>
  }
  if (records.length === 0) {
    return <p className="p-4 text-sm text-neutral-600">No records yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2 p-4">
      {records.map((record) => (
        <li key={record.countId}>
          <a
            href={`?count=${record.countId}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50"
          >
            <span className="flex flex-col">
              <span className="font-medium">{record.sabbathDate}</span>
              <span className="text-sm text-neutral-500 tabular-nums">${formatCents(record.totalAmountCents)}</span>
            </span>
            <StatusBadge record={record} />
          </a>
        </li>
      ))}
    </ul>
  )
}
