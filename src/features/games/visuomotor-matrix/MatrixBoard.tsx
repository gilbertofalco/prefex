import type { Matrix } from '../../../types/game'

interface MatrixBoardProps {
  matrix: Matrix
  readonly?: boolean
  errorCells?: { row: number; col: number }[]
  onCellClick?: (row: number, col: number) => void
  label: string
}

export function MatrixBoard({ matrix, readonly, errorCells = [], onCellClick, label }: MatrixBoardProps) {
  const errorSet = new Set(errorCells.map((e) => `${e.row}-${e.col}`))

  return (
    <div>
      <h3 className="mb-4 text-center text-xl font-semibold text-slate-800">{label}</h3>
      <div
        className="inline-grid gap-3 rounded-2xl bg-white p-6 shadow-md"
        style={{
          gridTemplateColumns: `repeat(${matrix[0]?.length ?? 4}, minmax(48px, 1fr))`,
        }}
        role="grid"
        aria-label={label}
      >
        {matrix.map((row, ri) =>
          row.map((cell, ci) => {
            const isError = errorSet.has(`${ri}-${ci}`)
            const isFilled = cell === 1
            const status = isFilled ? 'preenchido' : 'vazio'

            if (readonly) {
              return (
                <div
                  key={`${ri}-${ci}`}
                  role="gridcell"
                  aria-label={`Linha ${ri + 1}, coluna ${ci + 1}, ${status}`}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                    isFilled ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                  }`}
                />
              )
            }

            return (
              <button
                key={`${ri}-${ci}`}
                type="button"
                role="gridcell"
                aria-label={`Linha ${ri + 1}, coluna ${ci + 1}, ${status}`}
                aria-pressed={isFilled}
                onClick={() => onCellClick?.(ri, ci)}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  isError
                    ? 'border-red-500 bg-red-100'
                    : isFilled
                      ? 'border-slate-900 bg-slate-900 hover:bg-slate-700'
                      : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
