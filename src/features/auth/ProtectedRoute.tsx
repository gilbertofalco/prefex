import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from '../../types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-slate-600">Carregando...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && profile.role !== requiredRole) {
    const redirect = profile.role === 'professional' ? '/professional' : '/student'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
