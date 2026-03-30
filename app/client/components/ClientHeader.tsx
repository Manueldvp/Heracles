'use client'

import { Badge } from '@/components/ui/badge'
import ChatAssistant from './HerculesChat'

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
  clientName: string
  assistantName: string
  personality: string
  methodology: string
  trainerName?: string
  trainerAvatar?: string
}

export default function ClientHeader({
  firstName, greeting, goal, level, clientName, assistantName, personality, methodology, trainerName, trainerAvatar
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        {/* Left — saludo */}
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">{greeting}</p>
          <h2 className="font-display text-4xl text-white tracking-wide leading-none mt-0.5">{firstName}</h2>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge className={`text-xs px-2 py-0.5 border ${goalColor[goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              {goalLabel[goal]}
            </Badge>
            <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-xs px-2 py-0.5">
              {levelLabel[level] ?? level}
            </Badge>
          </div>
        </div>

        {/* Right */}
        {trainerName ? (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center overflow-hidden">
              {trainerAvatar ? (
                <img src={trainerAvatar} alt={trainerName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-400 font-bold text-sm">{trainerName.charAt(0)}</span>
              )}
            </div>
            <p className="text-zinc-600 text-xs">{trainerName}</p>
          </div>
        ) : null}
      </div>

      <ChatAssistant
        clientName={clientName}
        assistantName={assistantName}
        personality={personality}
        methodology={methodology}
      />
    </>
  )
}
