import type { ActivityResultInput } from '../types/game'

import { STORAGE_PREFIX } from './brand'

const PENDING_KEY = `${STORAGE_PREFIX}pending-results`

export function queuePendingResult(result: ActivityResultInput): void {
  try {
    const queue = getPendingResults()
    queue.push({ ...result, queuedAt: Date.now() })
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export function getPendingResults(): (ActivityResultInput & { queuedAt: number })[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    return JSON.parse(raw) as (ActivityResultInput & { queuedAt: number })[]
  } catch {
    return []
  }
}

export function removePendingResult(index: number): void {
  const queue = getPendingResults()
  queue.splice(index, 1)
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue))
}

export function clearPendingResults(): void {
  localStorage.removeItem(PENDING_KEY)
}
