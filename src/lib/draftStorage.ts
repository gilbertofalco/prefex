import { STORAGE_PREFIX } from './brand'

const DRAFT_PREFIX = `${STORAGE_PREFIX}draft:`
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface DraftEnvelope<T> {
  state: T
  savedAt: number
  startedAt: string
}

export function draftKey(studentId: string, activityId: string): string {
  return `${DRAFT_PREFIX}${studentId}:${activityId}`
}

export function saveDraft<T>(studentId: string, activityId: string, envelope: DraftEnvelope<T>): void {
  try {
    localStorage.setItem(draftKey(studentId, activityId), JSON.stringify(envelope))
  } catch {
    // localStorage full or unavailable
  }
}

export function loadDraft<T>(studentId: string, activityId: string): DraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(draftKey(studentId, activityId))
    if (!raw) return null
    const envelope = JSON.parse(raw) as DraftEnvelope<T>
    if (Date.now() - envelope.savedAt > DRAFT_MAX_AGE_MS) {
      clearDraft(studentId, activityId)
      return null
    }
    return envelope
  } catch {
    return null
  }
}

export function clearDraft(studentId: string, activityId: string): void {
  try {
    localStorage.removeItem(draftKey(studentId, activityId))
  } catch {
    // ignore
  }
}

export function isDraftExpired(savedAt: number): boolean {
  return Date.now() - savedAt > DRAFT_MAX_AGE_MS
}
