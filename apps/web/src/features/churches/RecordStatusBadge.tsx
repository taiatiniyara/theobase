export interface RecordStatusFields {
  status: 'submitted' | 'in_transit' | 'received'
  hasDiscrepancy: boolean
  discrepancyResolvedAt: string | null
}

// Compact badges/chips, not the full 4-stage stepper — see CONTEXT.md >
// UI/UX > Reconciliation status display: the stepper only belongs on a
// single record's detail view (#15), a list needs to stay dense and
// scannable instead. Shared by the church oversight list (#17/#18) and
// the Pastor's district roster (#19), which shows the same badge per
// church for its most recent record.
export function RecordStatusBadge({ record }: { record: RecordStatusFields }) {
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
