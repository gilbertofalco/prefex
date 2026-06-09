import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useGameSession } from '../shared/useGameSession'
import { useDraft } from '../shared/useDraft'
import { saveActivityResult } from '../shared/saveActivityResult'
import { ScoreModal } from '../shared/ScoreModal'
import { GameTimer } from '../shared/GameTimer'
import type { GameComponentProps } from '../../../types/game'

const PAD_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400']
const FLASH_MS = 600
const PAUSE_MS = 400

interface SimonState {
  sequence: number[]
  playerIndex: number
  round: number
  maxRounds: number
  phase: 'idle' | 'showing' | 'input' | 'wrong' | 'done'
  correctRounds: number
}

export default function SequenceSimonGame({ activityId, config, onComplete }: GameComponentProps) {
  const maxRounds = (config.rounds as number) ?? 5
  const padCount = (config.pads as number) ?? 4

  const { profile } = useAuth()
  const navigate = useNavigate()
  const { elapsedMs, start, stop, buildResult } = useGameSession()
  const { persist, restore, clear } = useDraft<SimonState>(profile!.id, activityId)

  const [sequence, setSequence] = useState<number[]>([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<SimonState['phase']>('idle')
  const [activePad, setActivePad] = useState<number | null>(null)
  const [correctRounds, setCorrectRounds] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [saving, setSaving] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const startRound = useCallback((currentSeq: number[]) => {
    setPhase('showing')
    setPlayerIndex(0)
    let i = 0
    const showNext = () => {
      if (i >= currentSeq.length) {
        setActivePad(null)
        setPhase('input')
        return
      }
      setActivePad(currentSeq[i])
      timeoutRef.current = window.setTimeout(() => {
        setActivePad(null)
        timeoutRef.current = window.setTimeout(() => {
          i++
          showNext()
        }, PAUSE_MS)
      }, FLASH_MS)
    }
    showNext()
  }, [])

  const initGame = useCallback(() => {
    const first = Math.floor(Math.random() * padCount)
    const seq = [first]
    setSequence(seq)
    setRound(1)
    setCorrectRounds(0)
    setStartedAt(new Date().toISOString())
    start()
    startRound(seq)
  }, [padCount, start, startRound])

  useEffect(() => {
    const draft = restore()
    if (draft && draft.state.phase !== 'done') {
      setSequence(draft.state.sequence)
      setRound(draft.state.round)
      setCorrectRounds(draft.state.correctRounds)
      setPhase('input')
      start()
    } else {
      initGame()
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    persist(
      { sequence, playerIndex, round, maxRounds, phase, correctRounds },
      startedAt,
    )
  }, [sequence, playerIndex, round, maxRounds, phase, correctRounds, startedAt, persist])

  const finishGame = useCallback(async (finalCorrect: number) => {
    stop()
    setPhase('done')
    const gameResult = buildResult({
      totalItems: maxRounds,
      correctItems: finalCorrect,
      payload: { sequence, correctRounds: finalCorrect, maxRounds },
    })
    setSaving(true)
    await saveActivityResult({
      studentId: profile!.id,
      activityId,
      startedAt: gameResult.startedAt,
      completedAt: gameResult.completedAt,
      durationMs: gameResult.durationMs,
      totalItems: maxRounds,
      correctItems: finalCorrect,
      payload: gameResult.payload,
    })
    onComplete(gameResult)
    clear()
    setSaving(false)
    setShowScore(true)
  }, [stop, buildResult, maxRounds, sequence, profile, activityId, onComplete, clear])

  const handlePadClick = (pad: number) => {
    if (phase !== 'input') return

    setActivePad(pad)
    setTimeout(() => setActivePad(null), 200)

    if (sequence[playerIndex] !== pad) {
      setPhase('wrong')
      finishGame(correctRounds)
      return
    }

    const nextIndex = playerIndex + 1
    setPlayerIndex(nextIndex)

    if (nextIndex >= sequence.length) {
      const newCorrect = correctRounds + 1
      setCorrectRounds(newCorrect)

      if (round >= maxRounds) {
        finishGame(newCorrect)
        return
      }

      const nextPad = Math.floor(Math.random() * padCount)
      const newSeq = [...sequence, nextPad]
      setSequence(newSeq)
      setRound(round + 1)
      setTimeout(() => startRound(newSeq), 800)
    }
  }

  const scorePercent = maxRounds > 0 ? (correctRounds / maxRounds) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/student')} className="text-lg text-slate-600">
            ← Voltar
          </button>
          <GameTimer elapsedMs={elapsedMs} />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-blue-800">Sequência Simon</h1>
        <p className="mb-4 text-lg text-slate-600">
          Observe a sequência e repita clicando nos botões na mesma ordem.
        </p>
        <p className="mb-8 text-lg font-semibold text-blue-700">
          Rodada {Math.min(round, maxRounds)} de {maxRounds}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {PAD_COLORS.slice(0, padCount).map((color, i) => (
            <button
              key={i}
              type="button"
              disabled={phase !== 'input' || saving}
              onClick={() => handlePadClick(i)}
              aria-label={`Botão ${i + 1}`}
              className={`h-32 rounded-2xl transition ${color} ${
                activePad === i ? 'scale-95 brightness-150 ring-4 ring-white' : 'opacity-80 hover:opacity-100'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            />
          ))}
        </div>

        {phase === 'showing' && (
          <p className="mt-6 text-center text-lg text-slate-600">Observe a sequência...</p>
        )}
        {phase === 'input' && (
          <p className="mt-6 text-center text-lg text-blue-700 font-semibold">Sua vez!</p>
        )}
      </div>

      {showScore && (
        <ScoreModal
          scorePercent={scorePercent}
          correctItems={correctRounds}
          totalItems={maxRounds}
          errorCount={maxRounds - correctRounds}
          durationMs={elapsedMs}
          onClose={() => { setShowScore(false); navigate('/student') }}
        />
      )}
    </div>
  )
}
