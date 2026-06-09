import { useCallback, useEffect, useRef } from 'react'
import { saveDraft, loadDraft, clearDraft, type DraftEnvelope } from '../../../lib/draftStorage'

const DEBOUNCE_MS = 300

export function useDraft<T>(studentId: string, activityId: string) {
  const debounceRef = useRef<number | null>(null)

  const persist = useCallback(
    (state: T, startedAt: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        saveDraft<T>(studentId, activityId, {
          state,
          savedAt: Date.now(),
          startedAt,
        })
      }, DEBOUNCE_MS)
    },
    [studentId, activityId],
  )

  const restore = useCallback((): DraftEnvelope<T> | null => {
    return loadDraft<T>(studentId, activityId)
  }, [studentId, activityId])

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    clearDraft(studentId, activityId)
  }, [studentId, activityId])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { persist, restore, clear }
}
