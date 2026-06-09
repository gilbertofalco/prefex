import type { Matrix, CompareResult } from '../../../types/game'

export function compareMatrices(expected: Matrix, answer: Matrix): CompareResult {
  let total = 0
  let correct = 0
  const errors: { row: number; col: number }[] = []

  for (let r = 0; r < expected.length; r++) {
    for (let c = 0; c < expected[r].length; c++) {
      total++
      if (expected[r][c] === answer[r]?.[c]) {
        correct++
      } else {
        errors.push({ row: r, col: c })
      }
    }
  }

  return {
    totalItems: total,
    correctItems: correct,
    scorePercent: total > 0 ? (correct / total) * 100 : 0,
    isPerfect: correct === total && total > 0,
    errors,
  }
}
