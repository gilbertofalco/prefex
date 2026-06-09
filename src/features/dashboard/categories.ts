export const CATEGORY_CONFIG = {
  atencao_memoria: {
    label: 'Atenção e Memória de Trabalho',
    color: '#F59E0B',
    bgClass: 'bg-amber-500 hover:bg-amber-600',
    icon: '🧠',
  },
  sequencia: {
    label: 'Sequência',
    color: '#3B82F6',
    bgClass: 'bg-blue-500 hover:bg-blue-600',
    icon: '🔢',
  },
  classificacao: {
    label: 'Classificação',
    color: '#8B5CF6',
    bgClass: 'bg-violet-500 hover:bg-violet-600',
    icon: '📂',
  },
  coordenacao_visomotora: {
    label: 'Coordenação Visomotora',
    color: '#10B981',
    bgClass: 'bg-emerald-500 hover:bg-emerald-600',
    icon: '👁️',
  },
  raciocinio_logico: {
    label: 'Raciocínio Lógico',
    color: '#EF4444',
    bgClass: 'bg-red-500 hover:bg-red-600',
    icon: '🧩',
  },
} as const

export type CategoryKey = keyof typeof CATEGORY_CONFIG
