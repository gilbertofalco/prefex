import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProfessionalHomePage() {
  const { profile } = useAuth()

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900">Bem-vindo(a), {profile?.full_name}</h2>
      <p className="mt-2 text-lg text-slate-600">
        Gerencie seus alunos e acompanhe os resultados das atividades cognitivas.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/professional/students"
          className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <span className="text-3xl">👥</span>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Alunos</h3>
          <p className="mt-1 text-slate-600">Veja a lista de alunos e estatísticas.</p>
        </Link>

        <Link
          to="/professional/results"
          className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <span className="text-3xl">📊</span>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Resultados</h3>
          <p className="mt-1 text-slate-600">Consulte e exporte resultados das atividades.</p>
        </Link>

        <Link
          to="/professional/register-student"
          className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <span className="text-3xl">➕</span>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Cadastrar Aluno</h3>
          <p className="mt-1 text-slate-600">Adicione um novo aluno ao sistema.</p>
        </Link>
      </div>
    </div>
  )
}
