export interface ActivityResultInput {
  studentId: string
  activityId: string
  startedAt: string
  completedAt: string
  durationMs: number
  totalItems: number
  correctItems: number
  payload?: Record<string, unknown>
}

export interface GameCompleteResult {
  startedAt: string
  completedAt: string
  durationMs: number
  totalItems: number
  correctItems: number
  payload?: Record<string, unknown>
}

export interface GameComponentProps {
  activityId: string
  config: Record<string, unknown>
  onComplete: (result: GameCompleteResult) => void
}

export type Cell = 0 | 1
export type Matrix = Cell[][]

export interface CompareResult {
  totalItems: number
  correctItems: number
  scorePercent: number
  isPerfect: boolean
  errors: { row: number; col: number }[]
}
