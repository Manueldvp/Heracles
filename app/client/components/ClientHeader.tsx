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
  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">{greeting}</p>
        <h2 className="mt-0.5 font-display text-4xl leading-none tracking-wide text-white">{firstName}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge className={`border px-2 py-0.5 text-xs ${goalColor[goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {goalLabel[goal]}
          </Badge>
          <Badge className="border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {levelLabel[level] ?? level}
          </Badge>
        </div>
      </div>

      {trainerName ? (
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-orange-500/30 bg-orange-500/20">
            {trainerAvatar ? (
              <img src={trainerAvatar} alt={trainerName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-orange-400">{trainerName.charAt(0)}</span>
            )}
          </div>
          <p className="text-xs text-zinc-600">{trainerName}</p>
        </div>
      ) : null}
    </div>
  )
}
