import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  approveRemovalRequest,
  createChurchAccount,
  editChurchAccount,
  fetchChurchAccounts,
  fetchPendingRemovalRequests,
  rejectRemovalRequest,
  requestAccountRemoval,
} from '../src/lib/localAccounts'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetchOnce(body: unknown, status = 200) {
  const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

describe('localAccounts API wrapper', () => {
  it('fetchChurchAccounts hits the right endpoint', async () => {
    const fetchSpy = stubFetchOnce({ accounts: [] })
    await fetchChurchAccounts()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/accounts/me/church')
  })

  it('createChurchAccount POSTs the new account fields', async () => {
    const fetchSpy = stubFetchOnce({ account: { id: 1 } })
    await createChurchAccount({ displayName: 'New Treasurer', phone: '+123', pin: '1234', role: 'treasurer' })
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/accounts/me/church')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({
      displayName: 'New Treasurer',
      phone: '+123',
      pin: '1234',
      role: 'treasurer',
    })
  })

  it('editChurchAccount PATCHes only the given fields', async () => {
    const fetchSpy = stubFetchOnce({ account: { id: 1 } })
    await editChurchAccount(1, { displayName: 'Renamed' })
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/accounts/1')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({ displayName: 'Renamed' })
  })

  it('requestAccountRemoval posts to the removal-requests endpoint', async () => {
    const fetchSpy = stubFetchOnce({ request: { id: 1 } })
    await requestAccountRemoval(5)
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/accounts/5/removal-requests')
  })

  it('fetchPendingRemovalRequests hits the pastor endpoint', async () => {
    const fetchSpy = stubFetchOnce({ requests: [] })
    await fetchPendingRemovalRequests()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/accounts/removal-requests/pending')
  })

  it('approveRemovalRequest posts to the approve endpoint', async () => {
    const fetchSpy = stubFetchOnce({ request: { id: 1, status: 'approved' } })
    await approveRemovalRequest(7)
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/accounts/removal-requests/7/approve')
  })

  it('rejectRemovalRequest posts the reason to the reject endpoint', async () => {
    const fetchSpy = stubFetchOnce({ request: { id: 1, status: 'rejected' } })
    await rejectRemovalRequest(7, 'Not enough grounds')
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/accounts/removal-requests/7/reject')
    expect(JSON.parse(init?.body as string)).toEqual({ reason: 'Not enough grounds' })
  })
})
