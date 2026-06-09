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

export async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  // Aguarda o trigger do Supabase criar o perfil (até 3 tentativas)
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await fetchProfile(user.id)
    if (existing) return existing
    if (attempt < 2) await sleep(400)
  }

  const row = profileFromUser(user)
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .maybeSingle()

  if (!insertError && created) return created as Profile

  if (insertError) {
    console.error('Erro ao criar perfil:', insertError.message)
    // Conflito = perfil já existe; tenta buscar de novo
    if (insertError.code === '23505') {
      return fetchProfile(user.id)
    }
  }

  return fetchProfile(user.id)
}

export function profileCreationErrorHint(): string {
  return 'Execute o arquivo supabase/migrations/003_fix_profile_trigger.sql no SQL Editor do Supabase.'
}

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Cadastre-se primeiro em "Criar conta profissional".'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail não confirmado. Verifique sua caixa de entrada ou desative "Confirm email" no Supabase.'
  }
  if (lower.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.'
  }
  return message
}
