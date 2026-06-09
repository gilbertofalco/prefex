import { lazy } from 'react'

export const gameRegistry = {
  'visuomotor-matrix': lazy(() => import('./visuomotor-matrix/VisuomotorMatrixGame')),
  'sequence-simon': lazy(() => import('./sequence-simon/SequenceSimonGame')),
  'classification-sort': lazy(() => import('./classification-sort/ClassificationGame')),
} as const

export type GameId = keyof typeof gameRegistry

export function isValidGameId(id: string): id is GameId {
  return id in gameRegistry
}
