import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Charts from './WeightChart'
import CheckinHistory from './CheckinHistory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Scale, Zap, Moon, Dumbbell, Droplets, Flame,
  Brain, Heart, ChevronLeft, TrendingDown, TrendingUp, Minus
} from 'lucide-react'
import Link from 'next/link'

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss: 'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength: 'Fuerza',
  endurance: 'Resistencia',
}

const levelLabel: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default async function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const { data: checkins } = await supabase
    .from('checkins').select('*').eq('client_id', id).order('created_at', { ascending: true })

  const all = checkins ?? []
  const checkinsWithWeight = all.filter(c => c.weight)
  const lastCheckin = all[all.length - 1]
  const firstWeight = checkinsWithWeight[0]?.weight
  const lastWeight = checkinsWithWeight[checkinsWithWeight.length - 1]?.weight
  const weightDiff = firstWeight && lastWeight ? +(lastWeight - firstWeight).toFixed(1) : null

  const avg = (field: string) => {
    const vals = all.filter(c => c[field] != null).map(c => c[field])
    return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : null
  }

  const painMap: Record<string, number> = {}
  all.forEach(c => (c.pain_zones ?? []).forEach((z: string) => { painMap[z] = (painMap[z] ?? 0) + 1 }))
  const topPainZones = Object.entries(painMap).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clients/${id}`} className="text-zinc-500 text-xs flex items-center gap-1 mb-1 hover:text-zinc-300 transition">
            <ChevronLeft size={13} /> Volver al perfil
          </Link>
          <h2 className="text-2xl font-bold text-white">{client.full_name}</h2>
          <p className="text-zinc-500 text-sm">{all.length} check-ins · progreso general</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs">Objetivo</p>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mt-1">
            {goalLabel[client.goal] ?? client.goal}
          </Badge>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Peso inicial', value: firstWeight ? `${firstWeight}kg` : '—', icon: Scale, color: 'text-zinc-400', bg: 'bg-zinc-800' },
          { label: 'Peso actual', value: lastWeight ? `${lastWeight}kg` : '—', icon: Scale, color: 'text-white', bg: 'bg-zinc-800' },
          {
            label: 'Variación',
            value: weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff}kg` : '—',
            icon: weightDiff === null ? Minus : weightDiff > 0 ? TrendingUp : TrendingDown,
            color: weightDiff === null ? 'text-zinc-400' : weightDiff > 0 ? 'text-blue-400' : 'text-green-400',
            bg: weightDiff === null ? 'bg-zinc-800' : weightDiff > 0 ? 'bg-blue-500/10' : 'bg-green-500/10'
          },
          { label: 'Check-ins', value: all.length, icon: Dumbbell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">{label}</p>
                  <p className={`font-bold text-xl leading-none ${color}`}>{value}</p>
                </div>
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={14} className={color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promedios */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold">Promedios generales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'Energía', value: avg('energy_level'), suffix: '/5', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Sueño', value: avg('sleep_quality'), suffix: '/5', icon: Moon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Mood', value: avg('mood'), suffix: '/5', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
              { label: 'Estrés', value: avg('stress_level'), suffix: '/5', icon: Brain, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Agua', value: avg('water_liters'), suffix: 'L', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Adherencia', value: avg('nutrition_adherence'), suffix: '%', icon: Flame, color: 'text-green-400', bg: 'bg-green-500/10' },
            ].map(({ label, value, suffix, icon: Icon, color, bg }, i) => (
              <div key={i} className={`${bg} rounded-xl p-3 text-center`}>
                <Icon size={14} className={`${color} mx-auto mb-1`} />
                <p className="text-zinc-500 text-xs">{label}</p>
                <p className={`${color} font-bold text-sm`}>{value ? `${value}${suffix}` : '—'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zonas de dolor */}
      {topPainZones.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Zonas de dolor reportadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topPainZones.map(([zone, count]) => (
                <div key={zone} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <span className="text-red-400 text-sm font-medium capitalize">{zone}</span>
                  <Badge className="bg-red-500/20 text-red-400 border-0 text-xs px-1.5">{count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      {all.length >= 2 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-semibold">Evolución en el tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts data={checkinsWithWeight} allData={all} />
          </CardContent>
        </Card>
      )}

      {/* Historial accordion */}
      {all.length > 0 && (
        <CheckinHistory checkins={[...all].reverse()} />
      )}
    </div>
  )
}