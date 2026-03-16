'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { TrendingUp, Dumbbell, Flame, Trophy, ChevronDown, ChevronUp, BarChart2, TrendingDown } from 'lucide-react'

interface SetLog { set: number; weight: number; reps: number }
interface ExerciseLog {
  id: string; exercise_name: string; date: string
  sets_data: SetLog[]; max_weight: number; total_volume: number
}
interface ExerciseSummary {
  name: string; logs: ExerciseLog[]
  latestMax: number; bestMax: number; trend: number; totalSessions: number
}

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return `${date.getDate()}/${date.getMonth() + 1}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-white text-xs font-semibold">
          {p.name}: <span style={{ color: p.color }}>{p.value} kg</span>
        </p>
      ))}
    </div>
  )
}

function ExerciseRow({ summary }: { summary: ExerciseSummary }) {
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'max' | 'volume'>('max')
  const trendPositive = summary.trend >= 0
  const hasMultiple = summary.logs.length > 1

  const chartData = summary.logs.map(l => ({
    date: formatDate(l.date),
    'Máx peso': l.max_weight,
    'Volumen': Math.round(l.total_volume),
  }))

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800/60 transition text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Dumbbell size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold capitalize truncate">{summary.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-zinc-600 text-xs">{summary.totalSessions} {summary.totalSessions === 1 ? 'sesión' : 'sesiones'}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500 text-xs">Récord: <span className="text-white font-semibold">{summary.bestMax} kg</span></span>
            {hasMultiple && (
              <>
                <span className="text-zinc-700">·</span>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {trendPositive ? '+' : ''}{summary.trend.toFixed(1)}%
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-zinc-600 shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-zinc-900/50 border-t border-zinc-800">
          {hasMultiple ? (
            <>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setView('max')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    view === 'max' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>Peso máximo</button>
                <button onClick={() => setView('volume')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    view === 'volume' ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>Volumen</button>
              </div>
              <div className="h-36 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  {view === 'max' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={35} unit="kg" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Máx peso" stroke="#3b82f6" strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit="kg" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Volumen" fill="#f97316" radius={[4,4,0,0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="text-zinc-600 text-xs text-center py-2 mb-3">Necesita más sesiones para ver la gráfica</p>
          )}

          <div className="flex flex-col gap-2">
            {[...summary.logs].reverse().slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start justify-between gap-2 bg-zinc-800/40 rounded-xl px-3 py-2">
                <span className="text-zinc-500 text-xs shrink-0">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {log.sets_data.map((s, j) => (
                    <span key={j} className="text-xs bg-zinc-700/60 rounded-lg px-2 py-0.5 text-zinc-300">
                      {s.weight > 0 ? `${s.weight}×${s.reps}` : `×${s.reps}`}
                    </span>
                  ))}
                </div>
                <span className="text-blue-400 text-xs font-semibold shrink-0">{log.max_weight}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Volume bar (same as client progress page) ────────────────────────────────
function VolumeBar({ sessionsThisWeek }: { sessionsThisWeek: number }) {
  const level = sessionsThisWeek >= 5 ? 'high' : sessionsThisWeek >= 3 ? 'medium' : 'low'
  const configs = {
    low:    { color: 'text-red-400',    label: 'Bajo',   desc: 'Poca frecuencia esta semana' },
    medium: { color: 'text-yellow-400', label: 'Medio',  desc: 'Frecuencia aceptable' },
    high:   { color: 'text-green-400',  label: 'Alto',   desc: 'Frecuencia óptima' },
  }
  const cfg = configs[level]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-2">
      <Flame size={14} className="text-orange-400" />
      <div className="flex gap-1 w-full">
        {(['low', 'medium', 'high'] as const).map((l) => (
          <div key={l} className={`flex-1 h-2 rounded-full ${
            level === 'high' ? 'bg-green-500'
            : level === 'medium' && l !== 'high' ? 'bg-yellow-500'
            : level === 'low' && l === 'low' ? 'bg-red-500'
            : 'bg-zinc-700'
          }`} />
        ))}
      </div>
      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
      <span className="text-zinc-600 text-xs text-center">{sessionsThisWeek} días / semana</span>
    </div>
  )
}

export default function ClientExerciseProgress({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [summaries, setSummaries] = useState<ExerciseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    sessions: 0,
    bestLift: 0,
    bestExercise: '',
    sessionsThisWeek: 0,
  })

  useEffect(() => {
    const load = async () => {
      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true })

      if (!logs) { setLoading(false); return }

      const grouped: Record<string, ExerciseLog[]> = {}
      logs.forEach(log => {
        const key = log.exercise_name.toLowerCase()
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(log)
      })

      const summaryList: ExerciseSummary[] = Object.entries(grouped).map(([name, exLogs]) => {
        const bestMax = Math.max(...exLogs.map(l => l.max_weight ?? 0))
        const latestMax = exLogs[exLogs.length - 1]?.max_weight ?? 0
        const firstMax = exLogs[0]?.max_weight ?? 0
        const trend = firstMax > 0 ? ((latestMax - firstMax) / firstMax) * 100 : 0
        return { name, logs: exLogs, latestMax, bestMax, trend, totalSessions: exLogs.length }
      }).sort((a, b) => b.totalSessions - a.totalSessions)

      setSummaries(summaryList)

      // Best lift = exercise with highest bestMax
      const topEx = summaryList.reduce((best, s) => s.bestMax > (best?.bestMax ?? 0) ? s : best, summaryList[0])

      const { data: sessions } = await supabase
        .from('workout_sessions').select('date').eq('client_id', clientId)

      // Sessions this week
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
      startOfWeek.setHours(0, 0, 0, 0)
      const thisWeek = (sessions ?? []).filter(s => new Date(s.date + 'T00:00:00') >= startOfWeek)

      setStats({
        sessions: sessions?.length ?? 0,
        bestLift: topEx?.bestMax ?? 0,
        bestExercise: topEx?.name ?? '',
        sessionsThisWeek: thisWeek.length,
      })

      setLoading(false)
    }
    load()
  }, [clientId])

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1">
          <Dumbbell size={14} className="text-blue-400" />
          <span className="text-white font-bold text-lg">{stats.sessions}</span>
          <span className="text-zinc-600 text-xs">Entrenos</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1">
          <Trophy size={14} className="text-orange-400" />
          <span className="text-white font-bold text-lg">{stats.bestLift > 0 ? `${stats.bestLift}` : '—'}</span>
          <span className="text-zinc-600 text-xs truncate w-full text-center">
            {stats.bestExercise ? `kg · ${stats.bestExercise.split(' ')[0]}` : 'Mejor kg'}
          </span>
        </div>
        <VolumeBar sessionsThisWeek={stats.sessionsThisWeek} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 bg-zinc-900 rounded-xl border border-dashed border-zinc-800">
          <BarChart2 size={22} className="text-zinc-600" />
          <p className="text-zinc-500 text-sm">Sin registros de pesos aún</p>
          <p className="text-zinc-700 text-xs text-center max-w-[200px]">El cliente verá aquí su progreso al registrar series con peso</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {summaries.map((s, i) => <ExerciseRow key={i} summary={s} />)}
        </div>
      )}
    </div>
  )
}
