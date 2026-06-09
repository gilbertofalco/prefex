export type UserRole = 'professional' | 'student'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  professional_id: string | null
  avatar_color: string
  created_at: string
}

export interface Activity {
  id: string
  category: string
  title: string
  description: string | null
  difficulty: number
  is_active: boolean
  config_schema: Record<string, unknown>
}

export interface ActivityResult {
  id: string
  student_id: string
  activity_id: string
  started_at: string
  completed_at: string
  duration_ms: number
  score_percent: number
  total_items: number
  correct_items: number
  error_count: number
  payload: Record<string, unknown>
  created_at: string
}

export interface ActivityResultWithDetails extends ActivityResult {
  student_name?: string
  activity_title?: string
}
