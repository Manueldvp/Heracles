'use client'

import { Badge } from '@/components/ui/badge'

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss: 'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength: 'Fuerza',
  endurance: 'Resistencia',
}

const goalColor: Record<string, string> = {
  muscle_gain: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fat_loss: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  maintenance: 'bg-green-500/20 text-green-400 border-green-500/30',
  strength: 'bg-red-500/20 text-red-400 border-red-500/30',
  endurance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const levelLabel: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

interface Props {
  firstName: string
  greeting: string
  goal: string
  level: string
  trainerName?: string
  trainerAvatar?: string
}

export default function ClientHeader({
  firstName, greeting, goal, level, trainerName, trainerAvatar
}: Props) {
  const goalText = goalLabel[goal] ?? goal?.trim()
  const levelText = levelLabel[level] ?? level?.trim()

  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{greeting}</p>
        <h2 className="mt-1 font-display text-4xl leading-none tracking-[0.04em] text-foreground sm:text-5xl">{firstName}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {goalText ? (
            <Badge className={`rounded-full border px-3 py-1 text-xs ${goalColor[goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              {goalText}
            </Badge>
          ) : null}
          {levelText ? (
            <Badge className="rounded-full border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
              {levelText}
            </Badge>
          ) : null}
        </div>
      </div>

      {trainerName ? (
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-card/80 px-3 py-2 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10">
            {trainerAvatar ? (
              <img src={trainerAvatar} alt={trainerName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{trainerName.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tu coach</p>
            <p className="truncate text-sm font-medium text-foreground">{trainerName}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
