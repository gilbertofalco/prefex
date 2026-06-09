import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isDemoMode } from '../../lib/supabase'
import { DEMO_CREDENTIALS } from '../../lib/demoMode'
import { APP_NAME, APP_TAGLINE } from '../../lib/brand'

type Tab = 'professional' | 'student'

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'professional' ? '/professional' : '/student', { replace: true })
    }
  }, [profile, navigate])

  if (profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-slate-600">Redirecionando...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate(tab === 'professional' ? '/professional' : '/student')
  }

  const fillDemo = (type: Tab) => {
    const creds = type === 'professional' ? DEMO_CREDENTIALS.professional : DEMO_CREDENTIALS.student
    setEmail(creds.email)
    setPassword(creds.password)
    setTab(type)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-emerald-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700">{APP_NAME}</h1>
          <p className="mt-2 text-lg text-slate-600">{APP_TAGLINE}</p>
        </div>

        {isDemoMode && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p className="font-semibold">Modo demonstração</p>
            <p className="mt-1">Supabase não configurado. Use as credenciais demo abaixo.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('professional')}
                className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-medium hover:bg-amber-300"
              >
                Preencher Profissional
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-medium hover:bg-amber-300"
              >
                Preencher Aluno
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('professional')}
            className={`flex-1 rounded-lg py-3 text-lg font-semibold transition ${
              tab === 'professional' ? 'bg-white text-indigo-700 shadow' : 'text-slate-600'
            }`}
          >
            Profissional
          </button>
          <button
            type="button"
            onClick={() => setTab('student')}
            className={`flex-1 rounded-lg py-3 text-lg font-semibold transition ${
              tab === 'student' ? 'bg-white text-indigo-700 shadow' : 'text-slate-600'
            }`}
          >
            Aluno
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {tab === 'professional' && (
          <p className="mt-6 text-center text-slate-600">
            Não tem conta?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
