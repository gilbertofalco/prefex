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

export async function fetchOrCreateProfile(user: User): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Erro ao buscar perfil:', fetchError.message)
  }

  if (existing) return existing as Profile

  const row = profileFromUser(user)
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(row)
    .select()
    .maybeSingle()

  if (insertError) {
    console.error('Erro ao criar perfil:', insertError.message)
    return null
  }

  return created as Profile | null
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
