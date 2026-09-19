import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMissionExceptions, fetchMissionSettings, updateMissionSettings } from '../src/lib/missions'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetchOnce(body: unknown, status = 200) {
  const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

describe('missions API wrapper', () => {
  it('fetchMissionExceptions hits the exceptions endpoint', async () => {
    const fetchSpy = stubFetchOnce({ missingCount: [], stuckReconciliation: [], discrepancies: [] })
    await fetchMissionExceptions()
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/missions/me/exceptions')
  })

  it('fetchMissionSettings hits the settings endpoint', async () => {
    const fetchSpy = stubFetchOnce({ settings: { stuckReconciliationThresholdDays: 45 } })
    const result = await fetchMissionSettings()
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/missions/me/settings')
    expect(result.settings.stuckReconciliationThresholdDays).toBe(45)
  })

  it('updateMissionSettings PATCHes the new threshold', async () => {
    const fetchSpy = stubFetchOnce({ settings: { stuckReconciliationThresholdDays: 20 } })
    await updateMissionSettings(20)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/missions/me/settings')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({ stuckReconciliationThresholdDays: 20 })
  })
})
