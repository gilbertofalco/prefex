export function calculateScore(totalItems: number, correctItems: number) {
  if (totalItems === 0) {
    return { scorePercent: 0, errorCount: 0 }
  }
  const scorePercent = Math.round((correctItems / totalItems) * 10000) / 100
  const errorCount = totalItems - correctItems
  return { scorePercent, errorCount }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}min ${seconds}s`
  }
  return `${seconds}s`
}

export function formatScorePercent(score: number): string {
  return `${score.toFixed(0)}%`
}
