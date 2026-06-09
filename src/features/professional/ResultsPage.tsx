import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isDemoMode, getSupabase } from '../../lib/supabase'
import { demoGetResultsForProfessional, demoGetStudents, demoGetActivities } from '../../lib/demoMode'
import { formatDuration, formatScorePercent } from '../../lib/scoring'
import type { ActivityResultWithDetails } from '../../types/database'

function exportToCsv(results: ActivityResultWithDetails[]) {
  const headers = ['Aluno', 'Atividade', 'Data', 'Pontuação', 'Acertos', 'Erros', 'Tempo (ms)']
  const rows = results.map((r) => [
    r.student_name ?? '',
    r.activity_title ?? r.activity_id,
    new Date(r.completed_at).toLocaleString('pt-BR'),
    r.score_percent.toFixed(1),
    `${r.correct_items}/${r.total_items}`,
    r.error_count.toString(),
    r.duration_ms.toString(),
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rita-resultados-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ResultsPage() {
  const { profile } = useAuth()
  const [results, setResults] = useState<ActivityResultWithDetails[]>([])
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([])
  const [activities, setActivities] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [filterStudent, setFilterStudent] = useState('')
  const [filterActivity, setFilterActivity] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const loadData = useCallback(async () => {
    if (!profile) return

    if (isDemoMode) {
      setResults(demoGetResultsForProfessional(profile.id))
      setStudents(demoGetStudents(profile.id).map((s) => ({ id: s.id, full_name: s.full_name })))
      setActivities(demoGetActivities().map((a) => ({ id: a.id, title: a.title })))
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setResults(demoGetResultsForProfessional(profile.id))
      setLoading(false)
      return
    }

    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('professional_id', profile.id)

    const studentIds = (studentProfiles ?? []).map((s: { id: string }) => s.id)
    setStudents((studentProfiles ?? []) as { id: string; full_name: string }[])

    const { data: activityList } = await supabase.from('activities').select('id, title')
    setActivities((activityList ?? []) as { id: string; title: string }[])

    if (studentIds.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    const { data: resultData } = await supabase
      .from('activity_results')
      .select('*')
      .in('student_id', studentIds)
      .order('completed_at', { ascending: false })

    const enriched: ActivityResultWithDetails[] = ((resultData ?? []) as ActivityResultWithDetails[]).map((r) => ({
      ...r,
      student_name: (studentProfiles as { id: string; full_name: string }[])?.find((s) => s.id === r.student_id)?.full_name,
      activity_title: (activityList as { id: string; title: string }[])?.find((a) => a.id === r.activity_id)?.title,
    }))

    setResults(enriched)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (filterStudent && r.student_id !== filterStudent) return false
      if (filterActivity && r.activity_id !== filterActivity) return false
      if (filterDateFrom && new Date(r.completed_at) < new Date(filterDateFrom)) return false
      if (filterDateTo) {
        const to = new Date(filterDateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(r.completed_at) > to) return false
      }
      return true
    })
  }, [results, filterStudent, filterActivity, filterDateFrom, filterDateTo])

  if (loading) return <p className="text-lg text-slate-600">Carregando resultados...</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Resultados</h2>
        <button
          type="button"
          onClick={() => exportToCsv(filtered)}
          disabled={filtered.length === 0}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-lg"
          aria-label="Filtrar por aluno"
        >
          <option value="">Todos os alunos</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>

        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-lg"
          aria-label="Filtrar por atividade"
        >
          <option value="">Todas as atividades</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-lg"
          aria-label="Data inicial"
        />

        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-lg"
          aria-label="Data final"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-lg text-slate-600">Nenhum resultado encontrado.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Aluno</th>
                <th className="px-4 py-3 font-semibold">Atividade</th>
                <th className="px-4 py-3 font-semibold">Data/Hora</th>
                <th className="px-4 py-3 font-semibold">Pontuação</th>
                <th className="px-4 py-3 font-semibold">Acertos</th>
                <th className="px-4 py-3 font-semibold">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{r.student_name}</td>
                  <td className="px-4 py-3">{r.activity_title ?? r.activity_id}</td>
                  <td className="px-4 py-3">{new Date(r.completed_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 font-semibold">{formatScorePercent(r.score_percent)}</td>
                  <td className="px-4 py-3">{r.correct_items}/{r.total_items}</td>
                  <td className="px-4 py-3">{formatDuration(r.duration_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
