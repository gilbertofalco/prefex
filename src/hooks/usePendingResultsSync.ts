import { useEffect } from 'react'
import { flushPendingResults, saveActivityResult } from '../features/games/shared/saveActivityResult'
import { getPendingResults } from '../lib/pendingResults'
import { isDemoMode } from '../lib/supabase'

export function usePendingResultsSync() {
  useEffect(() => {
    if (isDemoMode) return

    const sync = async () => {
      const queue = getPendingResults()
      if (queue.length === 0) return
      await flushPendingResults(saveActivityResult)
    }

    sync()

    const handleOnline = () => sync()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])
}
