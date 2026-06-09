import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isDemoMode, getSupabase } from '../../lib/supabase'
import { demoGetStudentStats } from '../../lib/demoMode'
import { formatScorePercent } from '../../lib/scoring'

interface StudentWithStats {
  id: string
  full_name: string
  avatar_color: string
  lastActivity: string | null
  lastCompletedAt: string | null
  avgScore: number | null
  totalSessions: number
}

export function StudentsPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadStudents = useCallback(async () => {
    if (!profile) return

    if (isDemoMode) {
      setStudents(demoGetStudentStats(profile.id))
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setStudents(demoGetStudentStats(profile.id))
      setLoading(false)
      return
    }

    const { data: studentProfiles, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('professional_id', profile.id)
      .eq('role', 'student')

    if (studentsError) {
      setLoadError(studentsError.message)
      setStudents([])
      setLoading(false)
      return
    }

    if (!studentProfiles) {
      setLoading(false)
      return
    }

    const stats: StudentWithStats[] = await Promise.all(
      (studentProfiles as { id: string; full_name: string; avatar_color: string }[]).map(async (s) => {
        const { data: results } = await supabase
          .from('activity_results')
          .select('score_percent, completed_at, activity_id')
          .eq('student_id', s.id)
          .order('completed_at', { ascending: false })

        const resultList = (results ?? []) as { score_percent: number; completed_at: string; activity_id: string }[]
        const avgScore = resultList.length > 0
          ? resultList.reduce((sum, r) => sum + r.score_percent, 0) / resultList.length
          : null

        return {
          id: s.id,
          full_name: s.full_name,
          avatar_color: s.avatar_color,
          lastActivity: resultList[0]?.activity_id ?? null,
          lastCompletedAt: resultList[0]?.completed_at ?? null,
          avgScore,
          totalSessions: resultList.length,
        }
      }),
    )

    setStudents(stats)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  if (loading) return <p className="text-lg text-slate-600">Carregando alunos...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Alunos</h2>

      {loadError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-red-700" role="alert">
          Erro ao carregar alunos: {loadError}
        </p>
      )}

      {students.length === 0 ? (
        <p className="mt-4 text-lg text-slate-600">Nenhum aluno cadastrado ainda.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-lg font-semibold">Nome</th>
                <th className="px-4 py-3 text-lg font-semibold">Sessões</th>
                <th className="px-4 py-3 text-lg font-semibold">Média</th>
                <th className="px-4 py-3 text-lg font-semibold">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                        style={{ backgroundColor: s.avatar_color }}
                      >
                        {s.full_name.charAt(0)}
                      </span>
                      <span className="text-lg">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-lg">{s.totalSessions}</td>
                  <td className="px-4 py-3 text-lg">
                    {s.avgScore !== null ? formatScorePercent(s.avgScore) : '—'}
                  </td>
                  <td className="px-4 py-3 text-lg text-slate-600">
                    {s.lastCompletedAt
                      ? new Date(s.lastCompletedAt).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
