'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Moon, Dumbbell, Heart, Brain, Droplets, Flame, ChevronDown, ChevronUp } from 'lucide-react'

interface Checkin {
  id: string
  created_at: string
  weight?: number
  energy_level?: number
  sleep_quality?: number
  completed_workouts?: number
  mood?: number
  stress_level?: number
  water_liters?: number
  calories_consumed?: number
  nutrition_adherence?: number
  pain_zones?: string[]
  photo_url?: string
  notes?: string
  type?: string
}

const typeLabel: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
}

function CheckinDetail({ c }: { c: Checkin }) {
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-zinc-700 mt-3">
      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Zap, label: 'Energía', value: c.energy_level ? `${c.energy_level}/5` : '—', color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { icon: Moon, label: 'Sueño', value: c.sleep_quality ? `${c.sleep_quality}/5` : '—', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Dumbbell, label: 'Entrenos', value: c.completed_workouts ?? '—', color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: Heart, label: 'Mood', value: c.mood ? `${c.mood}/5` : '—', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <div key={i} className={`${bg} rounded-xl p-2 text-center`}>
            <Icon size={11} className={`${color} mx-auto mb-0.5`} />
            <p className="text-zinc-600 text-xs">{label}</p>
            <p className={`${color} font-bold text-xs`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Métricas secundarias */}
      {(c.stress_level || c.water_liters || c.calories_consumed || c.nutrition_adherence) && (
        <div className="flex flex-wrap gap-2">
          {c.stress_level && (
            <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1">
              <Brain size={10} /> Estrés {c.stress_level}/5
            </div>
          )}
          {c.water_liters && (
            <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 rounded-lg px-2 py-1">
              <Droplets size={10} /> {c.water_liters}L agua
            </div>
          )}
          {c.calories_consumed && (
            <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-2 py-1">
              <Flame size={10} /> {c.calories_consumed} kcal
            </div>
          )}
          {c.nutrition_adherence && (
            <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 rounded-lg px-2 py-1">
              <Flame size={10} /> Adherencia {c.nutrition_adherence}%
            </div>
          )}
        </div>
      )}

      {/* Zonas de dolor */}
      {c.pain_zones && c.pain_zones.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {c.pain_zones.map((z: string) => (
            <Badge key={z} className="bg-red-500/15 text-red-400 border-red-500/20 text-xs capitalize">{z}</Badge>
          ))}
        </div>
      )}

      {/* Foto */}
      {c.photo_url && (
        <img src={c.photo_url} alt="Foto check-in" className="w-full max-h-48 object-cover rounded-xl" />
      )}

      {/* Notas */}
      {c.notes && (
        <p className="text-zinc-500 text-xs italic">"{c.notes}"</p>
      )}
    </div>
  )
}

export default function CheckinHistory({ checkins }: { checkins: Checkin[] }) {
  const [openId, setOpenId] = useState<string | null>(checkins[0]?.id ?? null)

  const latest = checkins[0]
  const rest = checkins.slice(1)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm font-semibold">Historial de check-ins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">

        {/* Último check-in — siempre expandido */}
        {latest && (
          <div className="bg-zinc-800 rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-medium">
                  {new Date(latest.created_at).toLocaleDateString('es-CL', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Último check-in</p>
              </div>
              <div className="flex items-center gap-2">
                {latest.type && (
                  <Badge className="bg-zinc-700 text-zinc-400 border-0 text-xs">{typeLabel[latest.type] ?? latest.type}</Badge>
                )}
                {latest.weight && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">{latest.weight}kg</Badge>
                )}
              </div>
            </div>
            <CheckinDetail c={latest} />
          </div>
        )}

        {/* Resto — accordion horizontal tipo scroll row + expandible */}
        {rest.length > 0 && (
          <div>
            <p className="text-zinc-600 text-xs mb-2">Check-ins anteriores</p>

            {/* Pills scrolleables */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {rest.map(c => (
                <button
                  key={c.id}
                  onClick={() => setOpenId(openId === c.id ? null : c.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all text-xs ${
                    openId === c.id
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  <span className="font-medium">
                    {new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </span>
                  {c.weight && <span>{c.weight}kg</span>}
                  <span className="flex items-center gap-1">
                    <Zap size={9} className="text-orange-400" />{c.energy_level ?? '—'}
                  </span>
                  {openId === c.id
                    ? <ChevronUp size={12} />
                    : <ChevronDown size={12} />
                  }
                </button>
              ))}
            </div>

            {/* Panel expandido del check-in seleccionado */}
            {openId && openId !== latest?.id && (() => {
              const selected = rest.find(c => c.id === openId)
              if (!selected) return null
              return (
                <div className="bg-zinc-800 rounded-xl p-4 mt-2 border border-zinc-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-xs font-medium">
                      {new Date(selected.created_at).toLocaleDateString('es-CL', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </p>
                    {selected.weight && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">{selected.weight}kg</Badge>
                    )}
                  </div>
                  <CheckinDetail c={selected} />
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}