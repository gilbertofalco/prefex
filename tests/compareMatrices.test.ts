import { describe, it, expect } from 'vitest'
import { compareMatrices } from '../src/features/games/visuomotor-matrix/compareMatrices'

describe('compareMatrices', () => {
  it('returns 100% for identical matrices', () => {
    const matrix = [
      [1, 0, 1],
      [0, 1, 0],
    ]
    const result = compareMatrices(matrix, matrix)
    expect(result.scorePercent).toBe(100)
    expect(result.isPerfect).toBe(true)
    expect(result.correctItems).toBe(6)
    expect(result.totalItems).toBe(6)
    expect(result.errors).toHaveLength(0)
  })

  it('returns 0% for completely wrong matrices', () => {
    const expected = [
      [1, 1],
      [1, 1],
    ]
    const answer = [
      [0, 0],
      [0, 0],
    ]
    const result = compareMatrices(expected, answer)
    expect(result.scorePercent).toBe(0)
    expect(result.isPerfect).toBe(false)
    expect(result.correctItems).toBe(0)
    expect(result.errors).toHaveLength(4)
  })

  it('returns partial score for mixed results', () => {
    const expected = [
      [1, 0],
      [0, 1],
    ]
    const answer = [
      [1, 1],
      [0, 1],
    ]
    const result = compareMatrices(expected, answer)
    expect(result.correctItems).toBe(3)
    expect(result.totalItems).toBe(4)
    expect(result.scorePercent).toBe(75)
    expect(result.errors).toEqual([{ row: 0, col: 1 }])
  })
})
