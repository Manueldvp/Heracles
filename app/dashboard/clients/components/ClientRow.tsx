'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DeleteClientButton from '../[id]/components/DeleteClientButton'
import Link from 'next/link'

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss:    'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength:    'Fuerza',
  endurance:   'Resistencia',
  general:     'General',
}
const levelLabel: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}
const goalColor: Record<string, string> = {
  muscle_gain: 'border-blue-800 text-blue-400',
  fat_loss:    'border-green-800 text-green-400',
  maintenance: 'border-yellow-800 text-yellow-400',
  strength:    'border-red-800 text-red-400',
  endurance:   'border-purple-800 text-purple-400',
  general:     'border-zinc-700 text-zinc-400',
}
const levelColor: Record<string, string> = {
  beginner:     'border-zinc-700 text-zinc-400',
  intermediate: 'border-orange-800 text-orange-400',
  advanced:     'border-red-800 text-red-400',
}

interface Client {
  id: string
  full_name: string
  email: string
  goal: string
  level: string
  age?: number
  weight?: number
  avatar_url?: string
  status?: string
  invite_token_expires_at?: string
}

export function ActiveClientRow({ client }: { client: Client }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition">
      <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
        <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            {client.avatar_url
              ? <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-orange-400 font-bold text-sm">{client.full_name.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-white truncate">{client.full_name}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${goalColor[client.goal] ?? 'border-zinc-700 text-zinc-400'}`}>
                {goalLabel[client.goal] ?? client.goal}
              </Badge>
              <Badge variant="outline" className={`text-xs ${levelColor[client.level] ?? 'border-zinc-700 text-zinc-400'}`}>
                {levelLabel[client.level] ?? client.level}
              </Badge>
              {(client.age || client.weight) && (
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">
                  {[client.age && `${client.age} años`, client.weight && `${client.weight}kg`].filter(Boolean).join(' · ')}
                </Badge>
              )}
            </div>
          </div>
        </Link>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <DeleteClientButton clientId={client.id} clientName={client.full_name} />
        </div>
      </CardContent>
    </Card>
  )
}

export function PendingClientRow({ client }: { client: Client }) {
  return (
    <Card className="bg-zinc-900/60 border-zinc-800/60">
      <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-zinc-700/40 border border-zinc-700/40 flex items-center justify-center shrink-0">
            <span className="text-zinc-500 font-bold text-sm">
              {client.email?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-medium text-zinc-400 truncate">{client.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                Pendiente de registro
              </Badge>
              {client.invite_token_expires_at && (
                <span className="text-zinc-600 text-xs">
                  Expira {new Date(client.invite_token_expires_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <DeleteClientButton clientId={client.id} clientName={client.email ?? 'cliente'} />
        </div>
      </CardContent>
    </Card>
  )
}
