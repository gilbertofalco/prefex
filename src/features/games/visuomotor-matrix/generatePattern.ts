import type { Matrix, Cell } from '../../../types/game'

export function generatePattern(rows: number, cols: number, fillRatio = 0.4): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < fillRatio ? 1 : 0) as Cell),
  )
}

export function createEmptyMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0 as Cell),
  )
}

export function toggleCell(matrix: Matrix, row: number, col: number): Matrix {
  return matrix.map((r, ri) =>
    r.map((cell, ci) => (ri === row && ci === col ? ((cell === 1 ? 0 : 1) as Cell) : cell)),
  )
}
