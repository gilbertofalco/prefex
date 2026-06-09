import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useGameSession } from '../shared/useGameSession'
import { useDraft } from '../shared/useDraft'
import { saveActivityResult } from '../shared/saveActivityResult'
import { ScoreModal } from '../shared/ScoreModal'
import { GameTimer } from '../shared/GameTimer'
import { MatrixBoard } from './MatrixBoard'
import { generatePattern, createEmptyMatrix, toggleCell } from './generatePattern'
import { compareMatrices } from './compareMatrices'
import type { GameComponentProps } from '../../../types/game'
import type { Matrix } from '../../../types/game'

interface VisuomotorState {
  pattern: Matrix
  answer: Matrix
  rows: number
  cols: number
}

export default function VisuomotorMatrixGame({ activityId, config, onComplete }: GameComponentProps) {
  const rows = (config.rows as number) ?? 4
  const cols = (config.cols as number) ?? 4
  const fillRatio = (config.fillRatio as number) ?? 0.4

  const { profile } = useAuth()
  const navigate = useNavigate()
  const { elapsedMs, start, stop, buildResult } = useGameSession()
  const { persist, restore, clear } = useDraft<VisuomotorState>(profile!.id, activityId)

  const [pattern, setPattern] = useState<Matrix>(() => generatePattern(rows, cols, fillRatio))
  const [answer, setAnswer] = useState<Matrix>(() => createEmptyMatrix(rows, cols))
  const [errorCells, setErrorCells] = useState<{ row: number; col: number }[]>([])
  const [showScore, setShowScore] = useState(false)
  const [scoreData, setScoreData] = useState<ReturnType<typeof compareMatrices> | null>(null)
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const draft = restore()
    if (draft) {
      setShowRestorePrompt(true)
    } else {
      start()
    }
  }, [restore, start])

  useEffect(() => {
    persist({ pattern, answer, rows, cols }, startedAt)
  }, [pattern, answer, rows, cols, startedAt, persist])

  const handleRestore = () => {
    const draft = restore()
    if (draft) {
      setPattern(draft.state.pattern)
      setAnswer(draft.state.answer)
      setStartedAt(draft.startedAt)
      start()
    }
    setShowRestorePrompt(false)
  }

  const handleDiscard = () => {
    clear()
    start()
    setShowRestorePrompt(false)
  }

  const handleCellClick = (row: number, col: number) => {
    setAnswer((prev) => toggleCell(prev, row, col))
    setErrorCells([])
  }

  const handleReset = () => {
    setPattern(generatePattern(rows, cols, fillRatio))
    setAnswer(createEmptyMatrix(rows, cols))
    setErrorCells([])
    setStartedAt(new Date().toISOString())
    start()
  }

  const handleComplete = useCallback(async () => {
    stop()
    const result = compareMatrices(pattern, answer)
    setErrorCells(result.errors)
    setScoreData(result)

    const gameResult = buildResult({
      totalItems: result.totalItems,
      correctItems: result.correctItems,
      payload: { pattern, answer, errors: result.errors },
    })

    setSaving(true)
    await saveActivityResult({
      studentId: profile!.id,
      activityId,
      startedAt: gameResult.startedAt,
      completedAt: gameResult.completedAt,
      durationMs: gameResult.durationMs,
      totalItems: result.totalItems,
      correctItems: result.correctItems,
      payload: gameResult.payload,
    })
    onComplete(gameResult)
    clear()
    setSaving(false)
    setShowScore(true)
  }, [stop, pattern, answer, buildResult, profile, activityId, onComplete, clear])

  const handleCloseScore = () => {
    setShowScore(false)
    navigate('/student')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="rounded-lg text-lg text-slate-600 hover:text-slate-900"
          >
            ← Voltar
          </button>
          <GameTimer elapsedMs={elapsedMs} />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-emerald-800">Matriz de Círculos</h1>
        <p className="mb-8 text-lg text-slate-600">
          Replique o padrão do quadro da esquerda clicando nos círculos da direita.
        </p>

        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
          <MatrixBoard matrix={pattern} readonly label="Modelo" />
          <MatrixBoard
            matrix={answer}
            errorCells={errorCells}
            onCellClick={handleCellClick}
            label="Sua resposta"
          />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleComplete}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Concluir'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border-2 border-slate-300 px-8 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <p className="text-xl font-bold">Continuar de onde parou?</p>
            <p className="mt-2 text-slate-600">Encontramos um rascunho salvo desta atividade.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleRestore}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700"
              >
                Começar de novo
              </button>
            </div>
          </div>
        </div>
      )}

      {showScore && scoreData && (
        <ScoreModal
          scorePercent={scoreData.scorePercent}
          correctItems={scoreData.correctItems}
          totalItems={scoreData.totalItems}
          errorCount={scoreData.totalItems - scoreData.correctItems}
          durationMs={elapsedMs}
          isPerfect={scoreData.isPerfect}
          onClose={handleCloseScore}
        />
      )}
    </div>
  )
}
