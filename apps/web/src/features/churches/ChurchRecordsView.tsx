import { useEffect, useState } from 'react'
import { type ChurchRecord, fetchChurchRecords } from '../../lib/churches'
import { RecordStatusBadge } from './RecordStatusBadge'

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
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
            <RecordStatusBadge record={record} />
          </a>
        </li>
      ))}
    </ul>
  )
}
