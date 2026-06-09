import { formatDuration, formatScorePercent } from '../../../lib/scoring'

interface ScoreModalProps {
  scorePercent: number
  correctItems: number
  totalItems: number
  errorCount: number
  durationMs: number
  onClose: () => void
  isPerfect?: boolean
}

export function ScoreModal({
  scorePercent,
  correctItems,
  totalItems,
  errorCount,
  durationMs,
  onClose,
  isPerfect,
}: ScoreModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 id="score-modal-title" className="text-2xl font-bold text-slate-900">
          {isPerfect ? 'Parabéns! Acerto perfeito!' : 'Atividade concluída'}
        </h2>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
            <span className="text-lg text-slate-700">Pontuação</span>
            <span className="text-3xl font-bold text-indigo-600">
              {formatScorePercent(scorePercent)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
              <p className="text-sm text-slate-600">Acertos</p>
              <p className="text-xl font-semibold text-green-700">
                {correctItems}/{totalItems}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3 text-center">
              <p className="text-sm text-slate-600">Erros</p>
              <p className="text-xl font-semibold text-red-700">{errorCount}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-sm text-slate-600">Tempo</p>
            <p className="text-xl font-semibold text-slate-800">{formatDuration(durationMs)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}
