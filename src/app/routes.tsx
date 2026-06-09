import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../features/auth/AuthContext'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterProfessionalPage } from '../features/auth/RegisterProfessionalPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { GamePage } from '../features/games/GamePage'
import { StudentLayout, ProfessionalLayout } from '../app/ProfessionalLayout'
import { ProfessionalHomePage } from '../features/professional/ProfessionalHomePage'
import { StudentsPage } from '../features/professional/StudentsPage'
import { ResultsPage } from '../features/professional/ResultsPage'
import { RegisterStudentPage } from '../features/professional/RegisterStudentPage'
import { usePendingResultsSync } from '../hooks/usePendingResultsSync'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
    mutations: { retry: 3 },
  },
})

function PendingResultsSync() {
  usePendingResultsSync()
  return null
}

export function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PendingResultsSync />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterProfessionalPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="game/:activityId" element={<GamePage />} />
            </Route>

            <Route
              path="/professional"
              element={
                <ProtectedRoute requiredRole="professional">
                  <ProfessionalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfessionalHomePage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="register-student" element={<RegisterStudentPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
