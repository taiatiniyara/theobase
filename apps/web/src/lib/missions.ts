import { apiFetch } from './api'

export interface MissionSettings {
  stuckReconciliationThresholdDays: number
}

export interface MissingCountException {
  churchId: number
  churchName: string
  missedSabbaths: string[]
}

export interface StuckReconciliationException {
  reconciliationId: number
  countId: number
  churchId: number
  churchName: string
  status: 'submitted' | 'in_transit'
  daysStuck: number
}

export interface DiscrepancyException {
  reconciliationId: number
  countId: number
  churchId: number
  churchName: string
  flaggedAt: string | null
}

export interface MissionExceptions {
  missingCount: MissingCountException[]
  stuckReconciliation: StuckReconciliationException[]
  discrepancies: DiscrepancyException[]
}

export function fetchMissionExceptions(): Promise<MissionExceptions> {
  return apiFetch('/missions/me/exceptions')
}

export function fetchMissionSettings(): Promise<{ settings: MissionSettings }> {
  return apiFetch('/missions/me/settings')
}

export function updateMissionSettings(stuckReconciliationThresholdDays: number): Promise<{ settings: MissionSettings }> {
  return apiFetch('/missions/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ stuckReconciliationThresholdDays }),
  })
}
