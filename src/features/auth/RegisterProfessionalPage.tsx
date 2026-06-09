import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RegisterProfessionalPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUpProfessional } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signUpError } = await signUpProfessional(email, password, fullName)
    setLoading(false)
    if (signUpError) {
      setError(signUpError)
      return
    }
    navigate('/professional')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-emerald-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-indigo-700">Cadastro de Profissional</h1>
        <p className="mt-2 text-slate-600">Crie sua conta para gerenciar alunos e resultados.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-lg font-medium text-slate-700">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
            />
          </div>

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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
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
            className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
