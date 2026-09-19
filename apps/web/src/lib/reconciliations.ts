import { apiFetch } from './api'

export type ReconciliationStatus = 'submitted' | 'in_transit' | 'received'

export interface Reconciliation {
  id: number
  countId: number
  status: ReconciliationStatus
  courierName: string | null
  sentAt: string | null
  sentByAccountId: number | null
  receivedAt: string | null
  receivedByAccountId: number | null
  hasDiscrepancy: boolean
  discrepancyProposedByAccountId: number | null
  discrepancyProposedReason: string | null
  discrepancyProposedAt: string | null
  discrepancyConfirmedByAccountId: number | null
  discrepancyResolvedAt: string | null
  createdAt: string
}

export interface ReconciliationLine {
  fundCategoryId: number
  categoryName: string
  amountCents: number
}

export interface ReceivedLine {
  fundCategoryId: number
  categoryName: string
  receivedAmountCents: number
}

export interface ReconciliationComment {
  id: number
  reconciliationId: number
  authorAccountId: number
  authorDisplayName: string
  body: string
  createdAt: string
}

export interface ReconciliationDetail {
  reconciliation: Reconciliation
  submittedLines: ReconciliationLine[]
  receivedLines: ReceivedLine[]
  comments: ReconciliationComment[]
}

export function fetchReconciliationByCount(countId: number): Promise<ReconciliationDetail> {
  return apiFetch(`/reconciliations/by-count/${countId}`)
}

export function markReconciliationSent(
  reconciliationId: number,
  courierName: string | null,
): Promise<{ reconciliation: Reconciliation }> {
  return apiFetch(`/reconciliations/${reconciliationId}/mark-sent`, {
    method: 'POST',
    body: JSON.stringify({ courierName }),
  })
}

export function markReconciliationReceived(
  reconciliationId: number,
  lines: { fundCategoryId: number; amountCents: number }[],
): Promise<{ reconciliation: Reconciliation }> {
  return apiFetch(`/reconciliations/${reconciliationId}/receive`, {
    method: 'POST',
    body: JSON.stringify({ lines }),
  })
}

export function proposeDiscrepancyResolution(
  reconciliationId: number,
  reason: string,
): Promise<{ reconciliation: Reconciliation }> {
  return apiFetch(`/reconciliations/${reconciliationId}/discrepancy/propose-resolution`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function confirmDiscrepancyResolution(
  reconciliationId: number,
): Promise<{ reconciliation: Reconciliation }> {
  return apiFetch(`/reconciliations/${reconciliationId}/discrepancy/confirm-resolution`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function addReconciliationComment(
  reconciliationId: number,
  body: string,
): Promise<{ comment: ReconciliationComment }> {
  return apiFetch(`/reconciliations/${reconciliationId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}
