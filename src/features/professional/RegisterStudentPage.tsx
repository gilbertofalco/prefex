import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RegisterStudentPage() {
  const { registerStudent } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: registerError } = await registerStudent(email, password, fullName)
    setLoading(false)

    if (registerError) {
      setError(registerError)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-md text-center">
        <p className="text-2xl font-bold text-green-700">Aluno cadastrado com sucesso!</p>
        <p className="mt-2 text-lg text-slate-600">
          O aluno pode fazer login com o e-mail <strong>{email}</strong>
        </p>
        <button
          type="button"
          onClick={() => navigate('/professional/students')}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-lg font-semibold text-white"
        >
          Ver lista de alunos
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-slate-900">Cadastrar Aluno</h2>
      <p className="mt-2 text-lg text-slate-600">Crie uma conta para o aluno acessar as atividades.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-md">
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
            Senha inicial
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
          <p className="rounded-lg bg-red-50 px-4 py-2 text-red-700" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
        </button>
      </form>
    </div>
  )
}
