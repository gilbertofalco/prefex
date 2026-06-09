import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { isDemoMode } from '../lib/supabase'
import { APP_NAME } from '../lib/brand'

export function StudentLayout() {
  const { profile, signOut, isDemoMode: demo } = useAuth()

  return (
    <div className="min-h-screen">
      {(demo || isDemoMode) && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          Modo demonstração — dados salvos localmente
        </div>
      )}
      <Outlet context={{ profile, signOut }} />
    </div>
  )
}

export function ProfessionalLayout() {
  const { profile, signOut, isDemoMode: demo } = useAuth()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-4 py-2 text-lg font-medium transition ${
      isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      {(demo || isDemoMode) && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          Modo demonstração — dados salvos localmente
        </div>
      )}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">{APP_NAME} — Painel Profissional</h1>
            <p className="text-slate-600">{profile?.full_name}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/professional" end className={navClass}>
              Início
            </NavLink>
            <NavLink to="/professional/students" className={navClass}>
              Alunos
            </NavLink>
            <NavLink to="/professional/results" className={navClass}>
              Resultados
            </NavLink>
            <NavLink to="/professional/register-student" className={navClass}>
              Cadastrar Aluno
            </NavLink>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-lg text-slate-700 hover:bg-slate-50"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
