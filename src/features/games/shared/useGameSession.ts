import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameCompleteResult } from '../../../types/game'

export function useGameSession() {
  const startTimeRef = useRef<Date | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback(() => {
    startTimeRef.current = new Date()
    setIsRunning(true)
    setElapsedMs(0)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current.getTime())
        }
      }, 100)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const buildResult = useCallback(
    (partial: Omit<GameCompleteResult, 'startedAt' | 'completedAt' | 'durationMs'>): GameCompleteResult => {
      const completedAt = new Date()
      const startedAt = startTimeRef.current ?? completedAt
      return {
        ...partial,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
      }
    },
    [],
  )

  return { elapsedMs, isRunning, start, stop, buildResult, startTime: startTimeRef }
}
