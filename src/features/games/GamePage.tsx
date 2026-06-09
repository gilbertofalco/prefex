import { Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameRegistry, isValidGameId } from './registry'
import { isDemoMode, getSupabase } from '../../lib/supabase'
import { demoGetActivities } from '../../lib/demoMode'
import type { Activity } from '../../types/database'
import type { GameCompleteResult } from '../../types/game'

export function GamePage() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!activityId) return
      if (isDemoMode) {
        setActivity(demoGetActivities().find((a) => a.id === activityId) ?? null)
        setLoading(false)
        return
      }
      const supabase = getSupabase()
      if (supabase) {
        const { data } = await supabase.from('activities').select('*').eq('id', activityId).single()
        setActivity(data as Activity | null)
      } else {
        setActivity(demoGetActivities().find((a) => a.id === activityId) ?? null)
      }
      setLoading(false)
    }
    load()
  }, [activityId])

  const handleComplete = useCallback((_result: GameCompleteResult) => {
    // Result saved by game component
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-slate-600">Carregando jogo...</p>
      </div>
    )
  }

  if (!activityId || !isValidGameId(activityId) || !activity) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-xl text-red-600">Atividade não encontrada.</p>
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-white"
        >
          Voltar ao Dashboard
        </button>
      </div>
    )
  }

  const GameComponent = gameRegistry[activityId]

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-xl text-slate-600">Carregando...</p>
        </div>
      }
    >
      <GameComponent
        activityId={activityId}
        config={activity.config_schema}
        onComplete={handleComplete}
      />
    </Suspense>
  )
}
