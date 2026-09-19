import { apiFetch } from './api'

export type LocalRole = 'treasurer' | 'clerk'

export interface LocalAccountSummary {
  id: number
  displayName: string
  role: LocalRole
  phone: string
  active: boolean
  createdAt: string
  hasPendingRemovalRequest: boolean
}

export function fetchChurchAccounts(): Promise<{ accounts: LocalAccountSummary[] }> {
  return apiFetch('/accounts/me/church')
}

export function createChurchAccount(input: {
  displayName: string
  phone: string
  pin: string
  role: LocalRole
}): Promise<{ account: LocalAccountSummary }> {
  return apiFetch('/accounts/me/church', { method: 'POST', body: JSON.stringify(input) })
}

export function editChurchAccount(
  accountId: number,
  input: { displayName?: string; phone?: string; pin?: string },
): Promise<{ account: LocalAccountSummary }> {
  return apiFetch(`/accounts/${accountId}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function requestAccountRemoval(accountId: number): Promise<{ request: { id: number } }> {
  return apiFetch(`/accounts/${accountId}/removal-requests`, { method: 'POST', body: '{}' })
}

export interface PendingRemovalRequest {
  id: number
  targetAccountId: number
  targetDisplayName: string
  targetRole: LocalRole
  churchId: number
  churchName: string
  requestedByAccountId: number
  createdAt: string
}

export function fetchPendingRemovalRequests(): Promise<{ requests: PendingRemovalRequest[] }> {
  return apiFetch('/accounts/removal-requests/pending')
}

export function approveRemovalRequest(requestId: number): Promise<{ request: { id: number; status: string } }> {
  return apiFetch(`/accounts/removal-requests/${requestId}/approve`, { method: 'POST', body: '{}' })
}

export function rejectRemovalRequest(
  requestId: number,
  reason: string,
): Promise<{ request: { id: number; status: string } }> {
  return apiFetch(`/accounts/removal-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
