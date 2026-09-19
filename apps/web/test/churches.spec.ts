import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchChurchCategories, fetchChurchRecords, setChurchCategoryEnabled } from '../src/lib/churches'

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

describe('fetchChurchCategories / setChurchCategoryEnabled', () => {
  it('fetchChurchCategories hits the categories endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ categories: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    await fetchChurchCategories()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/churches/me/categories')
  })

  it('setChurchCategoryEnabled PATCHes the toggle', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ categories: [{ id: 3, enabled: false }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    await setChurchCategoryEnabled(3, false)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/churches/me/categories/3')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({ enabled: false })
  })
})
