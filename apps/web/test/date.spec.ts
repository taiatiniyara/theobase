import { describe, expect, it } from 'vitest'
import { getMostRecentSaturday } from '../src/lib/date'

describe('getMostRecentSaturday', () => {
  it('returns today when today is a Saturday', () => {
    expect(getMostRecentSaturday(new Date('2026-09-19T12:00:00'))).toBe('2026-09-19')
  })

  it('returns yesterday when today is a Sunday', () => {
    expect(getMostRecentSaturday(new Date('2026-09-20T12:00:00'))).toBe('2026-09-19')
  })

  it('returns the prior Saturday for a mid-week date', () => {
    expect(getMostRecentSaturday(new Date('2026-09-18T12:00:00'))).toBe('2026-09-12') // Friday
    expect(getMostRecentSaturday(new Date('2026-09-15T12:00:00'))).toBe('2026-09-12') // Tuesday
  })
})
