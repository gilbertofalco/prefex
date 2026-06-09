import { getSupabase, isDemoMode } from './supabase'
import { translateAuthError } from './ensureProfile'
import type { Profile } from '../types/database'
import type { User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string | undefined

export interface RegisterStudentResult {
  error: string | null
  restoreUser?: User
  restoreProfile?: Profile
}

async function createStudentViaEdgeFunction(
  accessToken: string,
  professionalId: string,
  email: string,
  password: string,
  fullName: string,
): Promise<{ ok: boolean; error?: string; unavailable?: boolean; userId?: string }> {
  if (!supabaseUrl || !supabaseKey) return { ok: false, unavailable: true }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/create-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({ email, password, fullName, professionalId }),
    })

    if (res.status === 404) return { ok: false, unavailable: true }

    let body: { error?: string; userId?: string } = {}
    try {
      body = (await res.json()) as { error?: string; userId?: string }
    } catch {
      return { ok: false, error: `Erro no servidor (${res.status}). Tente novamente.` }
    }

    if (!res.ok) {
      return { ok: false, error: translateAuthError(body.error ?? 'Erro ao criar aluno') }
    }
    return { ok: true, userId: body.userId }
  } catch {
    return { ok: false, unavailable: true }
  }
}

async function ensureStudentProfile(
  studentId: string,
  fullName: string,
  professionalId: string,
): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return 'Supabase não configurado'

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', studentId)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: studentId,
      role: 'student',
      full_name: fullName,
      professional_id: professionalId,
    })
    if (insertError && insertError.code !== '23505') {
      return `Perfil do aluno não salvo: ${insertError.message}`
    }
  }

  const { data: saved, error: verifyError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', studentId)
    .eq('professional_id', professionalId)
    .eq('role', 'student')
    .maybeSingle()

  if (verifyError) return verifyError.message
  if (!saved) return 'Aluno não encontrado no banco após cadastro.'
  return null
}

export async function registerStudentInSupabase(
  professionalUser: User,
  professionalProfile: Profile,
  email: string,
  password: string,
  fullName: string,
): Promise<RegisterStudentResult> {
  if (isDemoMode) return { error: 'Modo demonstração ativo' }

  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase não configurado' }

  const {
    data: { session: professionalSession },
  } = await supabase.auth.getSession()
  if (!professionalSession) {
    return { error: 'Sessão expirada. Faça login novamente como profissional.' }
  }

  // Prefer Edge Function: cria aluno sem trocar a sessão do profissional
  const edge = await createStudentViaEdgeFunction(
    professionalSession.access_token,
    professionalProfile.id,
    email,
    password,
    fullName,
  )

  if (edge.ok) {
    if (edge.userId) {
      const profileError = await ensureStudentProfile(edge.userId, fullName, professionalProfile.id)
      if (profileError) return { error: profileError }
    }
    return {
      error: null,
      restoreUser: professionalUser,
      restoreProfile: professionalProfile,
    }
  }

  if (edge.error) {
    return { error: edge.error }
  }

  // Fallback: signUp troca sessão — restaurar tokens do profissional em seguida
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'student',
        full_name: fullName,
        professional_id: professionalProfile.id,
      },
    },
  })

  const { error: restoreError } = await supabase.auth.setSession({
    access_token: professionalSession.access_token,
    refresh_token: professionalSession.refresh_token,
  })

  if (restoreError) {
    return {
      error: 'Aluno pode ter sido criado, mas sua sessão foi perdida. Faça login como profissional.',
    }
  }

  if (signUpError) return { error: translateAuthError(signUpError.message) }
  if (!data.user) return { error: 'Não foi possível criar o aluno.' }

  const profileError = await ensureStudentProfile(data.user.id, fullName, professionalProfile.id)
  if (profileError) return { error: profileError }

  return {
    error: null,
    restoreUser: professionalUser,
    restoreProfile: professionalProfile,
  }
}
