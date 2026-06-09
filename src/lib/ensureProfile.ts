import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../types/database'
import { getSupabase } from './supabase'

function profileFromUser(user: User): Omit<Profile, 'created_at' | 'avatar_color'> & {
  avatar_color?: string
} {
  const meta = user.user_metadata ?? {}
  const role = (meta.role as UserRole) || 'student'
  const professionalId =
    typeof meta.professional_id === 'string' && meta.professional_id.length > 0
      ? meta.professional_id
      : null

  return {
    id: user.id,
    role,
    full_name: (meta.full_name as string) || user.email || 'Usuário',
    professional_id: professionalId,
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar perfil:', error.message)
    return null
  }

  return data as Profile | null
}

async function ensureProfileViaRpc(): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('ensure_user_profile')

  if (error) {
    console.error('RPC ensure_user_profile falhou:', error.message)
    return null
  }

  const rows = data as Profile[] | Profile | null
  if (Array.isArray(rows)) return rows[0] ?? null
  return (rows as Profile | null) ?? null
}

export async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await fetchProfile(user.id)
    if (existing) return existing
    if (attempt < 2) await sleep(300)
  }

  const viaRpc = await ensureProfileViaRpc()
  if (viaRpc) return viaRpc

  const row = profileFromUser(user)
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .maybeSingle()

  if (!insertError && created) return created as Profile

  if (insertError) {
    console.error('Erro ao criar perfil:', insertError.message, insertError.code)
    if (insertError.code === '23505') {
      return fetchProfile(user.id)
    }
  }

  return fetchProfile(user.id)
}

export function profileCreationErrorHint(): string {
  return 'Execute supabase/reset_database.sql e depois supabase/migrations/001_initial_schema.sql no SQL Editor.'
}

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Se esqueceu a senha, redefina no Supabase (Authentication → Users).'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail não confirmado. Desative "Confirm email" em Authentication → Providers → Email.'
  }
  if (lower.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.'
  }
  return message
}
