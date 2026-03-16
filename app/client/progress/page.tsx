'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import {
  TrendingUp, TrendingDown, Dumbbell, Trophy, ChevronDown, ChevronUp,
  BarChart2, ArrowLeft, Flame, Zap, Apple, Scale, Calendar, Minus
} from 'lucide-react'
import Link from 'next/link'

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
        <p key={i} className="text-white text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}{p.name?.includes('Peso') ? ' kg' : p.name?.includes('Vol') ? ' kg' : ''}
        </p>
      ))}
    </div>
  )
}

// ─── Volume Level Bar ──────────────────────────────────────────────────────────
function VolumeBar({ sessionsThisWeek }: { sessionsThisWeek: number }) {
  // For hypertrophy: 2-3 days = low, 3-4 = medium, 5+ = high
  const level = sessionsThisWeek >= 5 ? 'high' : sessionsThisWeek >= 3 ? 'medium' : 'low'
  const labels = { low: 'Bajo', medium: 'Medio', high: 'Alto' }
  const configs = {
    low:    { color: 'bg-red-500',    text: 'text-red-400',    label: 'Bajo',   desc: 'Aumenta la frecuencia para mejores resultados' },
    medium: { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medio',  desc: 'Buen volumen, sigue así' },
    high:   { color: 'bg-green-500',  text: 'text-green-400',  label: 'Alto',   desc: '¡Volumen óptimo para hipertrofia!' },
  }
  const cfg = configs[level]

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-orange-400" />
            <p className="text-white text-sm font-semibold">Volumen semanal</p>
          </div>
          <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>

        {/* 3-segment bar */}
        <div className="flex gap-1.5 mb-2">
          {(['low', 'medium', 'high'] as const).map((l) => (
            <div key={l} className={`flex-1 h-3 rounded-full transition-all ${
              level === 'high' ? 'bg-green-500'
              : level === 'medium' && l !== 'high' ? 'bg-yellow-500'
              : level === 'low' && l === 'low' ? 'bg-red-500'
              : 'bg-zinc-700'
            }`} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-xs">{cfg.desc}</p>
          <span className="text-zinc-600 text-xs">{sessionsThisWeek} días esta semana</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Exercise Progress Card ────────────────────────────────────────────────────
function ExerciseProgressCard({ summary }: { summary: ExerciseSummary }) {
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'max' | 'volume'>('max')
  const trendPositive = summary.trend >= 0
  const hasMultipleSessions = summary.logs.length > 1

  const chartData = summary.logs.map(l => ({
    date: formatDate(l.date),
    'Peso máx': l.max_weight,
    'Volumen': Math.round(l.total_volume),
  }))

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <button className="w-full flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Dumbbell size={16} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white font-semibold text-sm capitalize truncate">{summary.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-zinc-500 text-xs">{summary.totalSessions} {summary.totalSessions === 1 ? 'sesión' : 'sesiones'}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">Récord: <span className="text-white font-semibold">{summary.bestMax} kg</span></span>
              {hasMultipleSessions && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {trendPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {trendPositive ? '+' : ''}{summary.trend.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-zinc-600 mt-2 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expanded && (
          <div className="mt-4">
            {hasMultipleSessions ? (
              <>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setView('max')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      view === 'max' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800 text-zinc-500'
                    }`}>Peso máximo</button>
                  <button onClick={() => setView('volume')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      view === 'volume' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-500'
                    }`}>Volumen</button>
                </div>
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {view === 'max' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={35} unit="kg" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Peso máx" stroke="#3b82f6" strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit="kg" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Volumen" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-zinc-600 text-xs text-center py-3">Necesitas más sesiones para ver la gráfica de progreso</p>
            )}

            {/* Sessions detail */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto scrollbar-hide">
              {[...summary.logs].reverse().map((log, i) => (
                <div key={i} className="bg-zinc-800/60 rounded-xl px-3 py-2.5 border border-zinc-700/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-zinc-400 text-xs font-medium">
                      {new Date(log.date + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-blue-400 text-xs font-semibold">{log.max_weight} kg máx</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {log.sets_data.map((s, j) => (
                      <span key={j} className="text-xs bg-zinc-700/60 rounded-lg px-2 py-0.5 text-zinc-300">
                        {s.weight > 0 ? `${s.weight}kg × ${s.reps}` : `× ${s.reps}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientProgressPage() {
  const supabase = createClient()
  const [summaries, setSummaries] = useState<ExerciseSummary[]>([])
  const [loading, setLoading] = useState(true)

  // Stats
  const [totalSessions, setTotalSessions] = useState(0)
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0)
  const [streak, setStreak] = useState(0)
  const [topExercise, setTopExercise] = useState<{ name: string; kg: number } | null>(null)

  // Body weight
  const [weightData, setWeightData] = useState<{ date: string; Peso: number }[]>([])

  // Nutrition adherence
  const [nutritionData, setNutritionData] = useState<{ date: string; adherence: number }[]>([])
  const [avgAdherence, setAvgAdherence] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients').select('id').eq('user_id', user.id).single()
      if (!client) return

      // ── Exercise logs ──────────────────────────────────────────────────────
      const { data: logs } = await supabase
        .from('exercise_logs').select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: true })

      if (logs && logs.length > 0) {
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

        // Top exercise = highest bestMax
        const top = summaryList.reduce((best, s) => s.bestMax > (best?.bestMax ?? 0) ? s : best, summaryList[0])
        if (top) setTopExercise({ name: top.name, kg: top.bestMax })
      }

      // ── Workout sessions ───────────────────────────────────────────────────
      const { data: sessions } = await supabase
        .from('workout_sessions').select('date')
        .eq('client_id', client.id)
        .order('date', { ascending: false })

      if (sessions) {
        setTotalSessions(sessions.length)

        // Sessions this week (Mon–Sun)
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
        startOfWeek.setHours(0, 0, 0, 0)
        const thisWeekSessions = sessions.filter(s => new Date(s.date + 'T00:00:00') >= startOfWeek)
        setSessionsThisWeek(thisWeekSessions.length)

        // Streak — consecutive days with sessions
        const dates = new Set(sessions.map(s => s.date))
        let streakCount = 0
        const today = new Date()
        for (let i = 0; i < 365; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const key = d.toISOString().split('T')[0]
          if (dates.has(key)) streakCount++
          else if (i > 0) break
        }
        setStreak(streakCount)
      }

      // ── Check-ins: body weight ─────────────────────────────────────────────
      const { data: checkins } = await supabase
        .from('checkins').select('weight, nutrition_adherence, created_at, type')
        .eq('client_id', client.id)
        .not('weight', 'is', null)
        .order('created_at', { ascending: true })
        .limit(20)

      if (checkins) {
        const wData = checkins
          .filter(c => c.weight)
          .map(c => ({
            date: formatDate(c.created_at.split('T')[0]),
            Peso: c.weight,
          }))
        setWeightData(wData)
      }

      // ── Check-ins: nutrition adherence ─────────────────────────────────────
      const { data: weeklyCheckins } = await supabase
        .from('checkins').select('nutrition_adherence, created_at')
        .eq('client_id', client.id)
        .eq('type', 'weekly')
        .not('nutrition_adherence', 'is', null)
        .order('created_at', { ascending: true })
        .limit(10)

      if (weeklyCheckins && weeklyCheckins.length > 0) {
        const nData = weeklyCheckins.map(c => ({
          date: formatDate(c.created_at.split('T')[0]),
          adherence: c.nutrition_adherence,
        }))
        setNutritionData(nData)
        const avg = nData.reduce((acc, d) => acc + d.adherence, 0) / nData.length
        setAvgAdherence(Math.round(avg * 20)) // 1-5 → 0-100%
      }

      setLoading(false)
    }
    load()
  }, [])

  const adherenceLabel = avgAdherence >= 80 ? { text: '¡Excelente!', color: 'text-green-400' }
    : avgAdherence >= 50 ? { text: 'Regular', color: 'text-yellow-400' }
    : avgAdherence > 0 ? { text: 'Mejorable', color: 'text-red-400' }
    : null

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client"
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition shrink-0">
          <ArrowLeft size={16} className="text-zinc-400" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Mi progreso</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Tu evolución en un vistazo</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* ── Top stats ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Sessions */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 flex flex-col items-center gap-1">
                <Calendar size={15} className="text-blue-400" />
                <span className="text-white font-bold text-2xl">{totalSessions}</span>
                <span className="text-zinc-500 text-xs text-center">Entrenos</span>
              </CardContent>
            </Card>

            {/* Best exercise */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 flex flex-col items-center gap-1">
                <Trophy size={15} className="text-orange-400" />
                <span className="text-white font-bold text-2xl">{topExercise ? `${topExercise.kg}` : '—'}</span>
                <span className="text-zinc-500 text-xs text-center truncate w-full text-center">
                  {topExercise ? `kg · ${topExercise.name.split(' ')[0]}` : 'Sin datos'}
                </span>
              </CardContent>
            </Card>

            {/* Streak */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 flex flex-col items-center gap-1">
                <Zap size={15} className="text-yellow-400" />
                <span className="text-white font-bold text-2xl">{streak}</span>
                <span className="text-zinc-500 text-xs text-center">Racha días</span>
              </CardContent>
            </Card>
          </div>

          {/* ── Volume this week ── */}
          <VolumeBar sessionsThisWeek={sessionsThisWeek} />

          {/* ── Body weight ── */}
          {weightData.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Scale size={15} className="text-blue-400" />
                    <p className="text-white text-sm font-semibold">Peso corporal</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm">{weightData[weightData.length - 1]?.Peso} kg</span>
                    {weightData.length > 1 && (() => {
                      const diff = weightData[weightData.length - 1].Peso - weightData[0].Peso
                      const pos = diff > 0
                      return (
                        <span className={`text-xs flex items-center gap-0.5 ${pos ? 'text-blue-400' : 'text-green-400'}`}>
                          {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {pos ? '+' : ''}{diff.toFixed(1)} kg
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={38} unit="kg"
                        domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Peso" stroke="#3b82f6" strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Nutrition adherence ── */}
          {nutritionData.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Apple size={15} className="text-green-400" />
                    <p className="text-white text-sm font-semibold">Adherencia al plan</p>
                  </div>
                  {adherenceLabel && (
                    <span className={`text-sm font-bold ${adherenceLabel.color}`}>{adherenceLabel.text}</span>
                  )}
                </div>

                {/* Adherence dots — last 10 weekly checkins */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {nutritionData.map((d, i) => {
                    const pct = d.adherence * 20
                    const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">{d.adherence}</span>
                        </div>
                        <span className="text-zinc-600 text-xs">{d.date}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-zinc-600 text-xs">Escala 1–5 · de check-ins semanales</p>
              </CardContent>
            </Card>
          )}

          {/* ── Exercise history ── */}
          {summaries.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-500 text-xs uppercase tracking-widest px-1 flex items-center gap-1.5">
                <BarChart2 size={11} className="text-blue-400" />
                {summaries.length} ejercicios registrados
              </p>
              {summaries.map((s, i) => (
                <ExerciseProgressCard key={i} summary={s} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {summaries.length === 0 && weightData.length === 0 && (
            <Card className="bg-zinc-900 border-dashed border-zinc-800">
              <CardContent className="py-14 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <BarChart2 size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium">Sin datos aún</p>
                <p className="text-zinc-600 text-sm text-center max-w-[220px]">
                  Completa tu primer entrenamiento y un check-in para ver tu progreso
                </p>
                <Link href="/client"
                  className="mt-2 text-orange-400 text-sm hover:text-orange-300 transition flex items-center gap-1">
                  <ArrowLeft size={14} /> Volver al inicio
                </Link>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  )
}
