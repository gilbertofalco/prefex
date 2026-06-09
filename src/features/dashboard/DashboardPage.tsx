import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CategoryCard } from './CategoryCard'
import { CATEGORY_CONFIG, type CategoryKey } from './categories'
import { isDemoMode, getSupabase } from '../../lib/supabase'
import { demoGetActivities } from '../../lib/demoMode'
import type { Activity } from '../../types/database'
import { APP_NAME } from '../../lib/brand'

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const loadActivities = useCallback(async () => {
    if (isDemoMode) {
      setActivities(demoGetActivities())
      setLoading(false)
      return
    }
    const supabase = getSupabase()
    if (!supabase) {
      setActivities(demoGetActivities())
      setLoading(false)
      return
    }
    const { data } = await supabase.from('activities').select('*').order('difficulty')
    setActivities((data as Activity[]) ?? demoGetActivities())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const handleCategoryClick = (activity: Activity) => {
    if (activity.is_active) {
      navigate(`/student/game/${activity.id}`)
    } else {
      setShowComingSoon(true)
    }
  }

  const categories = Object.keys(CATEGORY_CONFIG) as CategoryKey[]
  const activitiesByCategory = categories.map((cat) => {
    const activity = activities.find((a) => a.category === cat)
    return { category: cat, activity }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">{APP_NAME}</h1>
            <p className="text-lg text-slate-600">
              Olá, <span className="font-semibold">{profile?.full_name}</span>!
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl border border-slate-300 px-5 py-2 text-lg text-slate-700 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">Escolha uma atividade</h2>
        <p className="mb-8 text-lg text-slate-600">
          Selecione uma categoria para começar o exercício cognitivo.
        </p>

        {loading ? (
          <p className="text-lg text-slate-500">Carregando atividades...</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activitiesByCategory.map(({ category, activity }) => (
              <CategoryCard
                key={category}
                category={category}
                title={activity?.title ?? CATEGORY_CONFIG[category].label}
                description={activity?.description ?? null}
                isActive={activity?.is_active ?? false}
                onClick={() => activity && handleCategoryClick(activity)}
              />
            ))}
          </div>
        )}
      </main>

      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-2xl font-bold text-slate-900">Em breve!</p>
            <p className="mt-2 text-lg text-slate-600">Esta atividade ainda está sendo desenvolvida.</p>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="mt-6 rounded-xl bg-indigo-600 px-8 py-3 text-lg font-semibold text-white hover:bg-indigo-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
