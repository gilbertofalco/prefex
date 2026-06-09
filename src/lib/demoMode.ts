import type { Profile, Activity, ActivityResult, ActivityResultWithDetails } from '../types/database'
import type { ActivityResultInput } from '../types/game'
import { STORAGE_PREFIX } from './brand'

const DEMO_USERS_KEY = `${STORAGE_PREFIX}demo:users`
const DEMO_SESSION_KEY = `${STORAGE_PREFIX}demo:session`
const DEMO_RESULTS_KEY = `${STORAGE_PREFIX}demo:results`

export interface DemoUser {
  id: string
  email: string
  password: string
  profile: Profile
}

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'visuomotor-matrix',
    category: 'coordenacao_visomotora',
    title: 'Matriz de Círculos',
    description: 'Replique o padrão de círculos preenchidos no quadro da direita.',
    difficulty: 1,
    is_active: true,
    config_schema: { rows: 4, cols: 4, fillRatio: 0.4 },
  },
  {
    id: 'sequence-simon',
    category: 'sequencia',
    title: 'Sequência Simon',
    description: 'Memorize e repita a sequência de cores e posições.',
    difficulty: 2,
    is_active: true,
    config_schema: { rounds: 5, pads: 4 },
  },
  {
    id: 'classification-sort',
    category: 'classificacao',
    title: 'Classificação',
    description: 'Arraste os cartões para a categoria correta.',
    difficulty: 1,
    is_active: true,
    config_schema: { items: 8 },
  },
  {
    id: 'attention-nback',
    category: 'atencao_memoria',
    title: 'N-Back',
    description: 'Identifique quando o estímulo atual é igual ao anterior.',
    difficulty: 3,
    is_active: false,
    config_schema: {},
  },
  {
    id: 'logic-patterns',
    category: 'raciocinio_logico',
    title: 'Padrões Lógicos',
    description: 'Complete a sequência lógica de formas.',
    difficulty: 2,
    is_active: false,
    config_schema: {},
  },
]

function uid(): string {
  return crypto.randomUUID()
}

function getUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY)
    if (raw) return JSON.parse(raw) as DemoUser[]
  } catch {
    // ignore
  }
  const defaultUsers = seedDefaultUsers()
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(defaultUsers))
  return defaultUsers
}

function saveUsers(users: DemoUser[]): void {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users))
}

function seedDefaultUsers(): DemoUser[] {
  const profId = uid()
  const studentId = uid()
  return [
    {
      id: profId,
      email: 'profissional@prefex.demo',
      password: 'demo123',
      profile: {
        id: profId,
        role: 'professional',
        full_name: 'Dr. Ana Profissional',
        professional_id: null,
        avatar_color: '#6366f1',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: studentId,
      email: 'aluno@prefex.demo',
      password: 'demo123',
      profile: {
        id: studentId,
        role: 'student',
        full_name: 'João Aluno',
        professional_id: profId,
        avatar_color: '#10B981',
        created_at: new Date().toISOString(),
      },
    },
  ]
}

export function demoLogin(email: string, password: string): DemoUser | null {
  const user = getUsers().find((u) => u.email === email && u.password === password)
  if (user) {
    localStorage.setItem(DEMO_SESSION_KEY, user.id)
    return user
  }
  return null
}

export function demoRegisterProfessional(
  email: string,
  password: string,
  fullName: string,
): DemoUser {
  const users = getUsers()
  if (users.some((u) => u.email === email)) {
    throw new Error('E-mail já cadastrado')
  }
  const id = uid()
  const user: DemoUser = {
    id,
    email,
    password,
    profile: {
      id,
      role: 'professional',
      full_name: fullName,
      professional_id: null,
      avatar_color: '#6366f1',
      created_at: new Date().toISOString(),
    },
  }
  users.push(user)
  saveUsers(users)
  localStorage.setItem(DEMO_SESSION_KEY, id)
  return user
}

export function demoRegisterStudent(
  professionalId: string,
  email: string,
  password: string,
  fullName: string,
): DemoUser {
  const users = getUsers()
  if (users.some((u) => u.email === email)) {
    throw new Error('E-mail já cadastrado')
  }
  const id = uid()
  const user: DemoUser = {
    id,
    email,
    password,
    profile: {
      id,
      role: 'student',
      full_name: fullName,
      professional_id: professionalId,
      avatar_color: '#10B981',
      created_at: new Date().toISOString(),
    },
  }
  users.push(user)
  saveUsers(users)
  return user
}

export function demoGetSession(): DemoUser | null {
  const sessionId = localStorage.getItem(DEMO_SESSION_KEY)
  if (!sessionId) return null
  return getUsers().find((u) => u.id === sessionId) ?? null
}

export function demoLogout(): void {
  localStorage.removeItem(DEMO_SESSION_KEY)
}

export function demoGetStudents(professionalId: string): Profile[] {
  return getUsers()
    .filter((u) => u.profile.professional_id === professionalId)
    .map((u) => u.profile)
}

export function demoGetActivities(): Activity[] {
  return DEFAULT_ACTIVITIES
}

export function demoSaveResult(input: ActivityResultInput): ActivityResult {
  const results = demoGetResults()
  const scorePercent = input.totalItems > 0
    ? Math.round((input.correctItems / input.totalItems) * 10000) / 100
    : 0
  const result: ActivityResult = {
    id: uid(),
    student_id: input.studentId,
    activity_id: input.activityId,
    started_at: input.startedAt,
    completed_at: input.completedAt,
    duration_ms: input.durationMs,
    score_percent: scorePercent,
    total_items: input.totalItems,
    correct_items: input.correctItems,
    error_count: input.totalItems - input.correctItems,
    payload: input.payload ?? {},
    created_at: new Date().toISOString(),
  }
  results.push(result)
  localStorage.setItem(DEMO_RESULTS_KEY, JSON.stringify(results))
  return result
}

export function demoGetResults(): ActivityResult[] {
  try {
    const raw = localStorage.getItem(DEMO_RESULTS_KEY)
    if (raw) return JSON.parse(raw) as ActivityResult[]
  } catch {
    // ignore
  }
  return []
}

export function demoGetResultsForProfessional(professionalId: string): ActivityResultWithDetails[] {
  const students = demoGetStudents(professionalId)
  const studentIds = new Set(students.map((s) => s.id))
  const studentMap = new Map(students.map((s) => [s.id, s.full_name]))
  const activityMap = new Map(DEFAULT_ACTIVITIES.map((a) => [a.id, a.title]))

  return demoGetResults()
    .filter((r) => studentIds.has(r.student_id))
    .map((r) => ({
      ...r,
      student_name: studentMap.get(r.student_id),
      activity_title: activityMap.get(r.activity_id),
    }))
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
}

export function demoGetStudentStats(professionalId: string) {
  const students = demoGetStudents(professionalId)
  const results = demoGetResultsForProfessional(professionalId)

  return students.map((student) => {
    const studentResults = results.filter((r) => r.student_id === student.id)
    const lastResult = studentResults[0]
    const avgScore = studentResults.length > 0
      ? studentResults.reduce((sum, r) => sum + r.score_percent, 0) / studentResults.length
      : null
    return {
      ...student,
      lastActivity: lastResult?.activity_title ?? null,
      lastCompletedAt: lastResult?.completed_at ?? null,
      avgScore,
      totalSessions: studentResults.length,
    }
  })
}

export const DEMO_CREDENTIALS = {
  professional: { email: 'profissional@prefex.demo', password: 'demo123' },
  student: { email: 'aluno@prefex.demo', password: 'demo123' },
}
