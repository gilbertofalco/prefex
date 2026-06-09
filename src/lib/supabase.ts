import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isDemoMode = !supabaseUrl || !supabaseAnonKey ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('your-anon-key')

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (isDemoMode) return null
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!)
  }
  return supabaseClient
}

export const supabase = getSupabase()
