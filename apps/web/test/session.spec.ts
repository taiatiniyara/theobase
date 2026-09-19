import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurrentAccount } from '../src/lib/session'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getCurrentAccount', () => {
  it('returns the account when a session is active', async () => {
    const account = {
      id: 1,
      displayName: 'Tia',
      accountType: 'local',
      role: 'treasurer',
      churchId: 5,
      districtId: null,
      missionId: null,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ account }), { status: 200 })),
    )
    expect(await getCurrentAccount()).toEqual(account)
  })

  it('returns null when there is no active session (401), rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 })),
    )
    expect(await getCurrentAccount()).toBeNull()
  })

  it('propagates any other error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'boom' }), { status: 500 })),
    )
    await expect(getCurrentAccount()).rejects.toThrow('boom')
  })
})
