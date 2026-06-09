import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft, clearDraft } from '../src/lib/draftStorage'

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads draft', () => {
    saveDraft('student-1', 'visuomotor-matrix', {
      state: { answer: [[1, 0]] },
      savedAt: Date.now(),
      startedAt: '2026-01-01T00:00:00Z',
    })
    const draft = loadDraft<{ answer: number[][] }>('student-1', 'visuomotor-matrix')
    expect(draft).not.toBeNull()
    expect(draft!.state.answer).toEqual([[1, 0]])
  })

  it('clears draft', () => {
    saveDraft('student-1', 'visuomotor-matrix', {
      state: { test: true },
      savedAt: Date.now(),
      startedAt: '2026-01-01T00:00:00Z',
    })
    clearDraft('student-1', 'visuomotor-matrix')
    expect(loadDraft('student-1', 'visuomotor-matrix')).toBeNull()
  })
})
