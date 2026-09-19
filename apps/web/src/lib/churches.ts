import { apiFetch } from './api'

export type ReconciliationStatus = 'submitted' | 'in_transit' | 'received'

export interface ChurchRecord {
  countId: number
  reconciliationId: number
  sabbathDate: string
  totalAmountCents: number
  status: ReconciliationStatus
  hasDiscrepancy: boolean
  discrepancyResolvedAt: string | null
}

export function fetchChurchRecords(): Promise<{ records: ChurchRecord[] }> {
  return apiFetch('/churches/me/records')
}
