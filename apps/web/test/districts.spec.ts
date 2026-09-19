import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchDistrictRoster } from '../src/lib/districts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchDistrictRoster', () => {
  it('hits the district roster endpoint and returns the roster', async () => {
    const roster = [
      {
        churchId: 1,
        churchName: 'Test Church',
        latestRecord: null,
        missingCount: false,
        hasStuckReconciliation: false,
        hasUnresolvedDiscrepancy: false,
      },
    ]
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ roster }), { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    const result = await fetchDistrictRoster()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/districts/me/roster')
    expect(result.roster).toEqual(roster)
  })
})
