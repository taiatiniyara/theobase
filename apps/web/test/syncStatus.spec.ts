import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetDBForTests,
  enqueue,
  recordSyncAttemptFailure,
  type SyncAttemptError,
} from '../src/lib/db'
import { getSyncStatus } from '../src/lib/syncStatus'

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('theobase')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(async () => {
  await __resetDBForTests()
  await deleteDatabase()
  setOnline(true)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getSyncStatus', () => {
  it('reports nothing pending when the outbox is empty', async () => {
    await expect(getSyncStatus()).resolves.toEqual({
      pendingCount: 0,
      stuck: false,
      stuckReason: null,
    })
  })

  it('is calm (not stuck) while offline, no matter how long a record has been pending', async () => {
    setOnline(false)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await enqueue('count', {})

    // Weeks later, still offline.
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'))
    const status = await getSyncStatus()
    expect(status).toEqual({ pendingCount: 1, stuck: false, stuckReason: null })
  })

  it('is calm while online but still within the grace period', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await enqueue('count', {})

    vi.setSystemTime(new Date('2026-01-01T00:00:30Z')) // 30s later
    const status = await getSyncStatus()
    expect(status.stuck).toBe(false)
  })

  it('escalates once online and pending past the grace period with no successful attempt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await enqueue('count', {})

    vi.setSystemTime(new Date('2026-01-01T00:05:00Z')) // 5 minutes later
    const status = await getSyncStatus()
    expect(status.stuck).toBe(true)
    expect(status.stuckReason).toMatch(/taking longer than expected/)
  })

  it('escalates immediately on a server rejection, regardless of online state or elapsed time', async () => {
    const id = await enqueue('count', {})
    const error: SyncAttemptError = { type: 'rejected', message: 'sabbathDate must be a Saturday' }
    await recordSyncAttemptFailure(id, error)

    setOnline(false) // even offline, a rejection is still a real problem
    const status = await getSyncStatus()
    expect(status.stuck).toBe(true)
    expect(status.stuckReason).toContain('sabbathDate must be a Saturday')
  })

  it('a network-type failure alone does not escalate while offline', async () => {
    const id = await enqueue('count', {})
    await recordSyncAttemptFailure(id, { type: 'network', message: 'Failed to fetch' })
    setOnline(false)

    const status = await getSyncStatus()
    expect(status.stuck).toBe(false)
  })

  it('counts every pending record, not just the problematic one', async () => {
    await enqueue('count', { a: 1 })
    const rejectedId = await enqueue('count', { a: 2 })
    await recordSyncAttemptFailure(rejectedId, { type: 'rejected', message: 'bad data' })

    const status = await getSyncStatus()
    expect(status.pendingCount).toBe(2)
    expect(status.stuck).toBe(true)
  })
})
