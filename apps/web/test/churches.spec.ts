import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchChurchRecords } from '../src/lib/churches'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchChurchRecords', () => {
  it('hits the church records endpoint and returns the records', async () => {
    const records = [
      {
        countId: 1,
        reconciliationId: 1,
        sabbathDate: '2026-09-19',
        totalAmountCents: 1000,
        status: 'submitted',
        hasDiscrepancy: false,
        discrepancyResolvedAt: null,
      },
    ]
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ records }), { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    const result = await fetchChurchRecords()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/churches/me/records')
    expect(result.records).toEqual(records)
  })
})
