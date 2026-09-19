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

export interface ChurchCategory {
  id: number
  name: string
  isTithe: boolean
  enabled: boolean
}

export function fetchChurchCategories(): Promise<{ categories: ChurchCategory[] }> {
  return apiFetch('/churches/me/categories')
}

export function setChurchCategoryEnabled(
  categoryId: number,
  enabled: boolean,
): Promise<{ categories: ChurchCategory[] }> {
  return apiFetch(`/churches/me/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}
