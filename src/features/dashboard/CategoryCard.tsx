import { CATEGORY_CONFIG, type CategoryKey } from './categories'

interface CategoryCardProps {
  category: CategoryKey
  title: string
  description: string | null
  isActive: boolean
  onClick: () => void
}

export function CategoryCard({ category, title, description, isActive, onClick }: CategoryCardProps) {
  const config = CATEGORY_CONFIG[category]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isActive}
      className={`group relative flex min-h-[180px] flex-col items-start justify-between rounded-2xl p-6 text-left text-white shadow-lg transition transform focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
        isActive
          ? `${config.bgClass} hover:scale-[1.02] cursor-pointer focus-visible:ring-white/50`
          : 'bg-slate-300 cursor-not-allowed opacity-70'
      }`}
      aria-label={`${title}${!isActive ? ' — Em breve' : ''}`}
    >
      <span className="text-4xl" aria-hidden="true">{config.icon}</span>
      <div>
        <h3 className="text-xl font-bold leading-tight">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-white/90 line-clamp-2">{description}</p>
        )}
      </div>
      {!isActive && (
        <span className="absolute right-4 top-4 rounded-full bg-white/30 px-3 py-1 text-xs font-semibold uppercase">
          Em breve
        </span>
      )}
    </button>
  )
}
