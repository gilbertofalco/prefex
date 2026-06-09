import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../auth/AuthContext'
import { useGameSession } from '../shared/useGameSession'
import { useDraft } from '../shared/useDraft'
import { saveActivityResult } from '../shared/saveActivityResult'
import { ScoreModal } from '../shared/ScoreModal'
import { GameTimer } from '../shared/GameTimer'
import type { GameComponentProps } from '../../../types/game'

interface CardItem {
  id: string
  label: string
  emoji: string
  category: 'fruits' | 'animals'
}

const ALL_ITEMS: CardItem[] = [
  { id: '1', label: 'Maçã', emoji: '🍎', category: 'fruits' },
  { id: '2', label: 'Banana', emoji: '🍌', category: 'fruits' },
  { id: '3', label: 'Uva', emoji: '🍇', category: 'fruits' },
  { id: '4', label: 'Laranja', emoji: '🍊', category: 'fruits' },
  { id: '5', label: 'Cachorro', emoji: '🐶', category: 'animals' },
  { id: '6', label: 'Gato', emoji: '🐱', category: 'animals' },
  { id: '7', label: 'Peixe', emoji: '🐟', category: 'animals' },
  { id: '8', label: 'Pássaro', emoji: '🐦', category: 'animals' },
]

interface ClassificationState {
  pool: string[]
  fruits: string[]
  animals: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function DraggableCard({ item }: { item: CardItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
      aria-label={item.label}
    >
      <span className="text-2xl">{item.emoji}</span>
      <span className="text-lg font-medium">{item.label}</span>
    </div>
  )
}

function DropZone({
  id,
  title,
  itemIds,
  items,
  colorClass,
}: {
  id: string
  title: string
  itemIds: string[]
  items: CardItem[]
  colorClass: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-2xl border-2 border-dashed p-4 transition ${
        isOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'
      }`}
    >
      <h3 className={`mb-4 text-xl font-bold ${colorClass}`}>{title}</h3>
      <div className="flex flex-col gap-2">
        {itemIds.map((id) => {
          const item = items.find((i) => i.id === id)
          return item ? <DraggableCard key={id} item={item} /> : null
        })}
      </div>
    </div>
  )
}

export default function ClassificationGame({ activityId, config, onComplete }: GameComponentProps) {
  const itemCount = (config.items as number) ?? 8
  const items = ALL_ITEMS.slice(0, itemCount)

  const { profile } = useAuth()
  const navigate = useNavigate()
  const { elapsedMs, start, stop, buildResult } = useGameSession()
  const { persist, restore, clear } = useDraft<ClassificationState>(profile!.id, activityId)

  const [pool, setPool] = useState<string[]>(() => shuffle(items.map((i) => i.id)))
  const [fruits, setFruits] = useState<string[]>([])
  const [animals, setAnimals] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showScore, setShowScore] = useState(false)
  const [scoreData, setScoreData] = useState({ correct: 0, total: 0, percent: 0 })
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const draft = restore()
    if (draft) {
      setPool(draft.state.pool)
      setFruits(draft.state.fruits)
      setAnimals(draft.state.animals)
      setStartedAt(draft.startedAt)
    }
    start()
  }, [restore, start])

  useEffect(() => {
    persist({ pool, fruits, animals }, startedAt)
  }, [pool, fruits, animals, startedAt, persist])

  const moveItem = (itemId: string, from: 'pool' | 'fruits' | 'animals', to: 'pool' | 'fruits' | 'animals') => {
    const remove = (list: string[]) => list.filter((id) => id !== itemId)
    const add = (list: string[]) => [...list, itemId]

    if (from === 'pool') setPool(remove(pool))
    if (from === 'fruits') setFruits(remove(fruits))
    if (from === 'animals') setAnimals(remove(animals))

    if (to === 'pool') setPool((p) => add(p))
    if (to === 'fruits') setFruits((f) => add(f))
    if (to === 'animals') setAnimals((a) => add(a))
  }

  const findContainer = (itemId: string): 'pool' | 'fruits' | 'animals' => {
    if (pool.includes(itemId)) return 'pool'
    if (fruits.includes(itemId)) return 'fruits'
    return 'animals'
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const itemId = active.id as string
    const from = findContainer(itemId)
    const to = over.id as 'pool' | 'fruits' | 'animals'
    if (from !== to) moveItem(itemId, from, to)
  }

  const handleClickAssign = (itemId: string, category: 'fruits' | 'animals') => {
    const from = findContainer(itemId)
    moveItem(itemId, from, category)
  }

  const calculateScore = useCallback(() => {
    let correct = 0
    const total = items.length
    for (const item of items) {
      const inFruits = fruits.includes(item.id)
      const inAnimals = animals.includes(item.id)
      if (item.category === 'fruits' && inFruits) correct++
      if (item.category === 'animals' && inAnimals) correct++
    }
    return { correct, total, percent: total > 0 ? (correct / total) * 100 : 0 }
  }, [items, fruits, animals])

  const handleComplete = async () => {
    stop()
    const result = calculateScore()
    setScoreData(result)

    const gameResult = buildResult({
      totalItems: result.total,
      correctItems: result.correct,
      payload: { fruits, animals, pool },
    })

    setSaving(true)
    await saveActivityResult({
      studentId: profile!.id,
      activityId,
      startedAt: gameResult.startedAt,
      completedAt: gameResult.completedAt,
      durationMs: gameResult.durationMs,
      totalItems: result.total,
      correctItems: result.correct,
      payload: gameResult.payload,
    })
    onComplete(gameResult)
    clear()
    setSaving(false)
    setShowScore(true)
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/student')} className="text-lg text-slate-600">
            ← Voltar
          </button>
          <GameTimer elapsedMs={elapsedMs} />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-violet-800">Classificação</h1>
        <p className="mb-8 text-lg text-slate-600">
          Arraste os cartões para Frutas ou Animais. Toque duas vezes para classificar rapidamente.
        </p>

        <DndContext
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-md">
            <h3 className="mb-3 text-lg font-semibold text-slate-700">Cartões</h3>
            <div className="flex flex-wrap gap-2">
              {pool.map((id) => {
                const item = items.find((i) => i.id === id)!
                return (
                  <div key={id} onDoubleClick={() => handleClickAssign(id, item.category)}>
                    <DraggableCard item={item} />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <DropZone id="fruits" title="Frutas 🍎" itemIds={fruits} items={items} colorClass="text-green-700" />
            <DropZone id="animals" title="Animais 🐾" itemIds={animals} items={items} colorClass="text-orange-700" />
          </div>

          <DragOverlay>
            {activeItem ? <DraggableCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleComplete}
            disabled={saving || pool.length > 0}
            className="rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : pool.length > 0 ? `Classifique todos (${pool.length} restantes)` : 'Concluir'}
          </button>
        </div>
      </div>

      {showScore && (
        <ScoreModal
          scorePercent={scoreData.percent}
          correctItems={scoreData.correct}
          totalItems={scoreData.total}
          errorCount={scoreData.total - scoreData.correct}
          durationMs={elapsedMs}
          isPerfect={scoreData.correct === scoreData.total}
          onClose={() => { setShowScore(false); navigate('/student') }}
        />
      )}
    </div>
  )
}
