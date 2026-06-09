import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isDemoMode, getSupabase } from '../../lib/supabase'
import {
  demoLogin,
  demoLogout,
  demoGetSession,
  demoRegisterProfessional,
} from '../../lib/demoMode'
import type { Profile } from '../../types/database'
import type { User } from '@supabase/supabase-js'
import { fetchOrCreateProfile, profileCreationErrorHint, translateAuthError } from '../../lib/ensureProfile'

interface AuthContextValue {
  user: User | { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUpProfessional: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; pendingConfirmation?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | { id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (isDemoMode) {
      const session = demoGetSession()
      if (session) {
        setUser({ id: session.id, email: session.email })
        setProfile(session.profile)
      } else {
        setUser(null)
        setProfile(null)
      }
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      const p = await fetchOrCreateProfile(session.user)
      setProfile(p)
    } else {
      setUser(null)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await refreshProfile()
      setLoading(false)
    }
    init()

    if (!isDemoMode) {
      const supabase = getSupabase()
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setUser(session.user)
            const p = await fetchOrCreateProfile(session.user)
            setProfile(p)
          } else {
            setUser(null)
            setProfile(null)
          }
        })
        return () => subscription.unsubscribe()
      }
    }
  }, [refreshProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      const demoUser = demoLogin(email, password)
      if (!demoUser) return { error: 'E-mail ou senha incorretos' }
      setUser({ id: demoUser.id, email: demoUser.email })
      setProfile(demoUser.profile)
      return { error: null }
    }

    const supabase = getSupabase()
    if (!supabase) return { error: 'Supabase não configurado' }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: translateAuthError(error.message) }
    if (data.user) {
      const p = await fetchOrCreateProfile(data.user)
      setUser(data.user)
      setProfile(p)
      if (!p) return { error: `Login ok, mas o perfil não foi criado. ${profileCreationErrorHint()}` }
    }
    await refreshProfile()
    return { error: null }
  }, [refreshProfile])

  const signUpProfessional = useCallback(async (email: string, password: string, fullName: string) => {
    if (isDemoMode) {
      try {
        const demoUser = demoRegisterProfessional(email, password, fullName)
        setUser({ id: demoUser.id, email: demoUser.email })
        setProfile(demoUser.profile)
        return { error: null }
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Erro ao registrar' }
      }
    }

    const supabase = getSupabase()
    if (!supabase) return { error: 'Supabase não configurado' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'professional', full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) return { error: translateAuthError(error.message) }
    if (!data.user) return { error: 'Não foi possível criar a conta.' }

    // Sem sessão = confirmação de e-mail ativa no Supabase.
    // O trigger já criou o perfil; o usuário deve fazer login depois.
    if (!data.session) {
      return { error: null, pendingConfirmation: true }
    }

    setUser(data.user)
    const p = await fetchOrCreateProfile(data.user)
    setProfile(p)
    if (!p) {
      return {
        error: `Conta criada, mas o perfil não foi encontrado. Tente fazer login. Se persistir: ${profileCreationErrorHint()}`,
      }
    }
    return { error: null }
  }, [refreshProfile])

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      demoLogout()
      setUser(null)
      setProfile(null)
      return
    }
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isDemoMode,
      signIn,
      signUpProfessional,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, signIn, signUpProfessional, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
