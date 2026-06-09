import { describe, it, expect } from 'vitest'
import { calculateScore, formatDuration, formatScorePercent } from '../src/lib/scoring'

describe('scoring', () => {
  it('calculates score and errors', () => {
    expect(calculateScore(10, 8)).toEqual({ scorePercent: 80, errorCount: 2 })
  })

  it('handles zero total items', () => {
    expect(calculateScore(0, 0)).toEqual({ scorePercent: 0, errorCount: 0 })
  })

  it('formats duration', () => {
    expect(formatDuration(65000)).toBe('1min 5s')
    expect(formatDuration(30000)).toBe('30s')
  })

  it('formats score percent', () => {
    expect(formatScorePercent(85.5)).toBe('86%')
  })
})
