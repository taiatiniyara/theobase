import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addReconciliationComment,
  confirmDiscrepancyResolution,
  fetchReconciliationByCount,
  markReconciliationReceived,
  markReconciliationSent,
  proposeDiscrepancyResolution,
} from '../src/lib/reconciliations'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetchOnce(body: unknown, status = 200) {
  const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

describe('reconciliations API wrapper', () => {
  it('fetchReconciliationByCount hits the right URL', async () => {
    const fetchSpy = stubFetchOnce({
      reconciliation: { id: 1, status: 'submitted' },
      submittedLines: [],
      receivedLines: [],
      comments: [],
    })
    await fetchReconciliationByCount(7)
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/by-count/7')
  })

  it('markReconciliationSent posts courierName', async () => {
    const fetchSpy = stubFetchOnce({ reconciliation: { id: 1, status: 'in_transit' } })
    await markReconciliationSent(1, 'Ferry to Suva')
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/1/mark-sent')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ courierName: 'Ferry to Suva' })
  })

  it('markReconciliationReceived posts the lines array', async () => {
    const fetchSpy = stubFetchOnce({ reconciliation: { id: 1, status: 'received' } })
    await markReconciliationReceived(1, [{ fundCategoryId: 2, amountCents: 500 }])
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/1/receive')
    expect(JSON.parse(init?.body as string)).toEqual({ lines: [{ fundCategoryId: 2, amountCents: 500 }] })
  })

  it('proposeDiscrepancyResolution posts the reason', async () => {
    const fetchSpy = stubFetchOnce({ reconciliation: { id: 1 } })
    await proposeDiscrepancyResolution(1, 'Counting error')
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/1/discrepancy/propose-resolution')
    expect(JSON.parse(init?.body as string)).toEqual({ reason: 'Counting error' })
  })

  it('confirmDiscrepancyResolution posts to the confirm endpoint', async () => {
    const fetchSpy = stubFetchOnce({ reconciliation: { id: 1 } })
    await confirmDiscrepancyResolution(1)
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/1/discrepancy/confirm-resolution')
  })

  it('addReconciliationComment posts the body', async () => {
    const fetchSpy = stubFetchOnce({ comment: { id: 1, body: 'hi' } })
    await addReconciliationComment(1, 'We recounted, our figure was correct')
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/reconciliations/1/comments')
    expect(JSON.parse(init?.body as string)).toEqual({ body: 'We recounted, our figure was correct' })
  })
})
