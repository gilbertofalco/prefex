import { formatDuration } from '../../../lib/scoring'

interface GameTimerProps {
  elapsedMs: number
}

export function GameTimer({ elapsedMs }: GameTimerProps) {
  return (
    <div
      className="inline-flex items-center gap-2">
      <span className="rounded-full bg-slate-800 px-4 py-2 text-lg font-mono font-semibold text-white">
        {formatDuration(elapsedMs)}
      </span>
    </div>
  )
}
