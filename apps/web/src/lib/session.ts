import { ApiError, apiFetch } from './api'

// The reconciliation detail screen (#15) needs to know who's actually
// looking at it — a Mission staffer and a church-side Treasurer/Clerk/
// Pastor see the same record but get different actions — and there's
// no client-side "current user" state anywhere yet (no login screen,
// #24). The session cookie set at login is already the source of
// truth server-side, so this just asks the server who it belongs to,
// rather than trying to keep a separate copy of that fact client-side.
export interface CurrentAccount {
  id: number
  displayName: string
  accountType: 'local' | 'institutional'
  role: string
  churchId: number | null
  districtId: number | null
  missionId: number | null
}

// null means "not logged in" (401) — a real, expected state (no login
// screen exists yet to prevent reaching this), not an error a caller
// needs to handle specially.
export async function getCurrentAccount(): Promise<CurrentAccount | null> {
  try {
    const { account } = await apiFetch<{ account: CurrentAccount }>('/auth/me')
    return account
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null
    }
    throw err
  }
}
