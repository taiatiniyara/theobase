import { apiFetch } from './api'

export type ReconciliationStatus = 'submitted' | 'in_transit' | 'received'

export interface DistrictChurchStatus {
  churchId: number
  churchName: string
  latestRecord: {
    countId: number
    sabbathDate: string
    status: ReconciliationStatus
    hasDiscrepancy: boolean
    discrepancyResolvedAt: string | null
  } | null
  missingCount: boolean
  hasStuckReconciliation: boolean
  hasUnresolvedDiscrepancy: boolean
}

export function fetchDistrictRoster(): Promise<{ roster: DistrictChurchStatus[] }> {
  return apiFetch('/districts/me/roster')
}
