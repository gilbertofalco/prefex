import { isDemoMode, getSupabase } from '../../../lib/supabase'
import { calculateScore } from '../../../lib/scoring'
import { demoSaveResult } from '../../../lib/demoMode'
import { queuePendingResult } from '../../../lib/pendingResults'
import type { ActivityResultInput } from '../../../types/game'
import type { ActivityResult } from '../../../types/database'

export async function saveActivityResult(
  input: ActivityResultInput,
): Promise<{ data: ActivityResult | null; error: Error | null; queued: boolean }> {
  const { scorePercent, errorCount } = calculateScore(input.totalItems, input.correctItems)

  if (isDemoMode) {
    const result = demoSaveResult(input)
    return { data: result, error: null, queued: false }
  }

  const supabase = getSupabase()
  if (!supabase) {
    queuePendingResult(input)
    return { data: null, error: new Error('Supabase não configurado'), queued: true }
  }

  const { data, error } = await supabase
    .from('activity_results')
    .insert({
      student_id: input.studentId,
      activity_id: input.activityId,
      started_at: input.startedAt,
      completed_at: input.completedAt,
      duration_ms: input.durationMs,
      score_percent: scorePercent,
      total_items: input.totalItems,
      correct_items: input.correctItems,
      error_count: errorCount,
      payload: input.payload ?? {},
    })
    .select()
    .single()

  if (error) {
    queuePendingResult(input)
    return { data: null, error: new Error(error.message), queued: true }
  }

  return { data: data as ActivityResult, error: null, queued: false }
}

export async function flushPendingResults(
  saveFn: (input: ActivityResultInput) => Promise<{ data: ActivityResult | null; error: Error | null; queued: boolean }>,
): Promise<number> {
  const { getPendingResults, removePendingResult } = await import('../../../lib/pendingResults')
  const queue = getPendingResults()
  let flushed = 0

  for (let i = queue.length - 1; i >= 0; i--) {
    const item = queue[i]
    const { error, queued } = await saveFn({
      studentId: item.studentId,
      activityId: item.activityId,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      durationMs: item.durationMs,
      totalItems: item.totalItems,
      correctItems: item.correctItems,
      payload: item.payload,
    })
    if (!error && !queued) {
      removePendingResult(i)
      flushed++
    }
  }

  return flushed
}
