'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dumbbell, ChevronRight, Play, Check, Timer,
  RotateCcw, Zap, Hash, Clock, TimerReset, Trophy, Flame, Star, Plus, Minus, AlertCircle, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ExerciseMedia from '@/components/exercise-media'
import { inferMuscleGroup } from '@/lib/exercise-groups'

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
  image_url?: string
  video_url?: string
  media_url?: string
  media_type?: string
}

interface WorkoutDay {
  day: string
  focus?: string
  exercises: Exercise[]
}

interface SetLog {
  set: number
  weight: number
  reps: number
}

interface Props {
  routine: {
    content?: {
      days?: WorkoutDay[]
    }
  } | null
  routineId: string
  clientId: string
}

function parseRestSeconds(rest?: string): number {
  if (!rest) return 60
  const s = rest.toLowerCase().trim()
  if (s.includes('min')) return parseInt(s) * 60
  if (s.includes(':')) {
    const [m, sec] = s.split(':').map(Number)
    return m * 60 + sec
  }
  return parseInt(s) || 60
}

function estimateWorkSeconds(exercise: Exercise): number {
  return Math.max(20, (parseInt(exercise.reps) || 10) * 3)
}

type Phase = 'idle' | 'working'
type RestTransition =
  | { type: 'set'; exerciseIndex: number; nextSet: number }
  | { type: 'exercise'; nextExerciseIndex: number }
  | null

const MOTIVATIONAL = [
  '¡Bestia mode activado!',
  '¡Eso es disciplina pura!',
  '¡Tu yo futuro te lo agradece!',
  '¡Sin excusas, puro trabajo!',
  '¡Otro día, otra victoria!',
  '¡Los campeones no se detienen!',
]

function getNextPendingIndex(items: boolean[], startIndex: number) {
  for (let index = startIndex; index < items.length; index += 1) {
    if (!items[index]) return index
  }
  return -1
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#eab308', '#ec4899']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i / 18) * 100}%`,
          top: '-10px',
          width: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 5,
          height: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 5,
          background: colors[i % colors.length],
          borderRadius: i % 2 === 0 ? '50%' : '2px',
          animation: `confettiFall 1.8s ease-in ${(i * 0.12).toFixed(2)}s both`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity:1; }
          80%  { opacity:1; }
          100% { transform: translateY(240px) rotate(720deg) scale(0.4); opacity:0; }
        }
      `}</style>
    </div>
  )
}

// ─── Circular Timer ────────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, color }: { seconds: number; total: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r
  const progress = total > 0 ? (seconds / total) * circ : 0
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#27272a" strokeWidth="4" fill="none" />
        <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ - progress} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <span className="absolute text-white font-bold text-sm">{seconds}</span>
    </div>
  )
}

// ─── Set Logger ────────────────────────────────────────────────────────────────
function SetLogger({ exercise, onComplete }: {
  exercise: Exercise
  onComplete: (sets: SetLog[]) => void
}) {
  const defaultReps = parseInt(exercise.reps) || 10
  const [sets, setSets] = useState<SetLog[]>(
    Array.from({ length: exercise.sets }, (_, i) => ({ set: i + 1, weight: 0, reps: defaultReps }))
  )
  const [errors, setErrors] = useState<boolean[]>(Array(exercise.sets).fill(false))
  const [shaking, setShaking] = useState(false)

  const update = (index: number, field: 'weight' | 'reps', delta: number) => {
    setSets(prev => prev.map((s, i) => i === index
      ? { ...s, [field]: Math.max(0, parseFloat((s[field] + delta).toFixed(2))) }
      : s))
    if (field === 'weight') setErrors(prev => prev.map((e, i) => i === index ? false : e))
  }

  const updateDirect = (index: number, field: 'weight' | 'reps', value: string) => {
    const num = parseFloat(value) || 0
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: Math.max(0, num) } : s))
    if (field === 'weight' && num > 0) setErrors(prev => prev.map((e, i) => i === index ? false : e))
  }

  const handleComplete = () => {
    const newErrors = sets.map(s => s.weight <= 0)
    if (newErrors.some(Boolean)) {
      setErrors(newErrors)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }
    onComplete(sets)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Registra tus series</p>
        <p className="text-zinc-600 text-xs">Peso requerido · Reps</p>
      </div>

      {sets.map((s, i) => (
        <div key={i} className={`rounded-xl border transition-all ${
          errors[i] ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-700/60 bg-zinc-900/80'
        } ${shaking && errors[i] ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${errors[i] ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
              <span className={`text-xs font-bold ${errors[i] ? 'text-red-400' : 'text-orange-400'}`}>{s.set}</span>
            </div>
            {/* Weight */}
            <div className="flex items-center gap-1.5 flex-1">
              <button onClick={() => update(i, 'weight', -2.5)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition active:scale-95 shrink-0">
                <Minus size={12} />
              </button>
              <div className="flex-1 flex flex-col items-center min-w-0">
                <input type="number" inputMode="decimal"
                  value={s.weight || ''}
                  onChange={e => updateDirect(i, 'weight', e.target.value)}
                  placeholder="0"
                  className={`w-full text-center bg-transparent font-bold text-base focus:outline-none ${
                    errors[i] ? 'text-red-400 placeholder:text-red-400/50' : 'text-white placeholder:text-zinc-600'
                  }`} />
                <p className={`text-xs -mt-0.5 ${errors[i] ? 'text-red-400' : 'text-zinc-600'}`}>kg</p>
              </div>
              <button onClick={() => update(i, 'weight', 2.5)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition active:scale-95 shrink-0">
                <Plus size={12} />
              </button>
            </div>
            <div className="w-px h-9 bg-zinc-700/60 shrink-0" />
            {/* Reps */}
            <div className="flex items-center gap-1.5 flex-1">
              <button onClick={() => update(i, 'reps', -1)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition active:scale-95 shrink-0">
                <Minus size={12} />
              </button>
              <div className="flex-1 flex flex-col items-center min-w-0">
                <input type="number" inputMode="numeric"
                  value={s.reps || ''}
                  onChange={e => updateDirect(i, 'reps', e.target.value)}
                  placeholder="0"
                  className="w-full text-center bg-transparent text-white font-bold text-base focus:outline-none placeholder:text-zinc-600" />
                <p className="text-zinc-600 text-xs -mt-0.5">reps</p>
              </div>
              <button onClick={() => update(i, 'reps', 1)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition active:scale-95 shrink-0">
                <Plus size={12} />
              </button>
            </div>
          </div>
          {errors[i] && (
            <div className="px-3 pb-2 flex items-center gap-1.5">
              <AlertCircle size={11} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">Ingresa el peso utilizado</p>
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleComplete}
          className="h-10 w-full rounded-xl px-5 text-sm font-semibold active:scale-[0.98] sm:w-auto sm:min-w-[190px]"
        >
          <Check size={16} /> Guardar y continuar
        </Button>
      </div>
    </div>
  )
}

// ─── Rest Screen ───────────────────────────────────────────────────────────────
function RestScreen({ exercise, nextExercise, currentSet, totalSets, timeLeft, total, onSkip }: {
  exercise: Exercise | null
  nextExercise: Exercise | null
  currentSet: number
  totalSets: number
  timeLeft: number
  total: number
  onSkip: () => void
}) {
  const r = 54, circ = 2 * Math.PI * r
  const pct = total > 0 ? timeLeft / total : 0
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg width="144" height="144" className="-rotate-90">
          <circle cx="72" cy="72" r={r} stroke="#27272a" strokeWidth="6" fill="none" />
          <circle cx="72" cy="72" r={r} stroke="#a855f7" strokeWidth="6" fill="none"
            strokeDasharray={circ} strokeDashoffset={circ - pct * circ} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <TimerReset size={16} className="text-purple-400 mb-1" />
          <span className="text-white font-bold text-3xl">{timeLeft}</span>
          <span className="text-purple-400 text-xs">seg</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-purple-300 font-semibold text-base">Descansando</p>
        {exercise && currentSet <= totalSets ? (
          <p className="text-zinc-500 text-sm mt-0.5">
            Sigue con <span className="text-white capitalize">{exercise.name}</span> · serie {currentSet} de {totalSets}
          </p>
        ) : nextExercise ? (
          <p className="text-zinc-500 text-sm mt-0.5">
            Siguiente ejercicio: <span className="text-white capitalize">{nextExercise.name}</span>
          </p>
        ) : null}
      </div>
      <button onClick={onSkip}
        className="text-zinc-500 hover:text-zinc-300 text-xs transition border border-zinc-700 hover:border-zinc-500 rounded-xl px-4 py-2">
        Saltar descanso →
      </button>
    </div>
  )
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, index, isActive, isCompleted, onStart, onLogComplete, phase, timeLeft, totalTime, loggedSets, autoOpenLogger, currentSet }: {
  exercise: Exercise; index: number; isActive: boolean; isCompleted: boolean
  onStart: () => void; onLogComplete: (sets: SetLog[]) => void
  phase: Phase; timeLeft: number; totalTime: number; loggedSets?: SetLog[]; autoOpenLogger?: boolean; currentSet: number
}) {
  const [showLogger, setShowLogger] = useState(false)
  const loggerOpen = isActive && (showLogger || !!autoOpenLogger)

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
      isCompleted ? 'bg-green-500/5 border-green-500/20 opacity-70'
      : isActive ? 'bg-zinc-800 border-blue-500/40 shadow-lg shadow-blue-500/5'
      : 'bg-zinc-800/60 border-zinc-700/50'
    }`}>
      <div className="grid gap-0 border-b border-zinc-700/40 md:grid-cols-[180px_1fr]">
        <ExerciseMedia exercise={exercise} compact className="rounded-none border-0 bg-transparent" />

        <div className="flex items-start gap-3 px-4 py-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className={`font-semibold text-base capitalize ${isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
                  {exercise.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Ejercicio {index + 1}</p>
                {isActive && !isCompleted && (
                  <p className="mt-1 text-xs text-zinc-400">Serie actual: {currentSet} / {exercise.sets}</p>
                )}
              </div>

              {isActive && phase === 'working' ? (
                <CircularTimer seconds={timeLeft} total={totalTime} color="#3b82f6" />
              ) : isCompleted ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/20 shrink-0">
                  <Check size={16} className="text-green-400" />
                </div>
              ) : !isActive ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-700/50 shrink-0">
                  <span className="text-zinc-500 text-xs font-bold">{index + 1}</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-700/60 rounded-lg px-2 py-0.5">
                <Hash size={9} className="text-orange-400" />
                <span className="text-zinc-300 text-xs">{exercise.sets} series</span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-700/60 rounded-lg px-2 py-0.5">
                <Zap size={9} className="text-blue-400" />
                <span className="text-zinc-300 text-xs">{exercise.reps} reps</span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-700/60 rounded-lg px-2 py-0.5">
                <TimerReset size={9} className="text-purple-400" />
                <span className="text-zinc-300 text-xs">{exercise.rest}</span>
              </div>
            </div>

            {isCompleted && loggedSets && loggedSets.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {loggedSets.map((s, i) => (
                  <span key={i} className="text-xs text-zinc-500 bg-zinc-800/80 rounded-md px-1.5 py-0.5">
                    {s.weight > 0 ? `${s.weight}kg×${s.reps}` : `×${s.reps}`}
                  </span>
                ))}
              </div>
            )}

            {isActive && phase === 'idle' && !loggerOpen && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button size="sm" onClick={onStart}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-9 gap-1 px-3 active:scale-95">
                  <Play size={12} /> Iniciar ejercicio
                </Button>
                <button onClick={() => setShowLogger(true)}
                  className="text-zinc-300 hover:text-white transition text-xs flex items-center justify-center gap-1 h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500/30 hover:bg-green-500/10">
                  <Check size={12} /> Registrar series
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isActive && phase === 'working' && (
        <div className="px-4 py-2.5 border-t border-blue-500/20 bg-blue-500/5 flex items-center gap-2">
          <Timer size={12} className="text-blue-400" />
          <span className="text-blue-400 text-xs font-medium">Ejecutando serie {currentSet} de {exercise.sets}...</span>
          {exercise.notes && <span className="text-zinc-600 text-xs truncate ml-auto max-w-[130px]">{exercise.notes}</span>}
        </div>
      )}

      {isActive && phase === 'idle' && autoOpenLogger && !loggerOpen && (
        <div className="px-4 py-3 border-t border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2">
          <Sparkles size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-emerald-300 text-sm font-medium">Tiempo completado</p>
            <p className="text-zinc-400 text-xs mt-1">Registra las series para pasar al siguiente paso del entrenamiento.</p>
          </div>
        </div>
      )}

      {isActive && loggerOpen && phase === 'idle' && (
        <div className="px-4 pb-4 pt-3 border-t border-zinc-700/50">
          <SetLogger exercise={exercise} onComplete={(sets) => { setShowLogger(false); onLogComplete(sets) }} />
        </div>
      )}

      {isActive && phase === 'idle' && !loggerOpen && exercise.notes && (
        <div className="px-4 py-2 border-t border-zinc-700/50 flex items-center gap-1.5">
          <span className="text-zinc-600 text-xs">💡</span>
          <p className="text-zinc-500 text-xs">{exercise.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Completion Screen ─────────────────────────────────────────────────────────
function CompletionScreen({ exercises, allLogs, onReset, isToday, completedAt }: {
  exercises: Exercise[]; allLogs: Record<number, SetLog[]>
  onReset: () => void; isToday: boolean; completedAt: string | null
}) {
  const [showConfetti, setShowConfetti] = useState(true)
  const motivation = MOTIVATIONAL[exercises.length % MOTIVATIONAL.length]

  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 2200); return () => clearTimeout(t) }, [])

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0)
  const maxWeight = Math.max(0, ...Object.values(allLogs).flat().map(s => s.weight))
  const setsByGroup = exercises.reduce<Record<string, number>>((acc, exercise) => {
    const group = inferMuscleGroup(exercise.name)
    acc[group] = (acc[group] ?? 0) + exercise.sets
    return acc
  }, {})

  return (
    <div className="relative py-2">
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center gap-1 mb-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/30 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center">
            <Trophy size={34} className="text-orange-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-zinc-900">
            <Check size={13} className="text-white" />
          </div>
        </div>
        <h3 className="text-white font-bold text-xl mt-2">{motivation}</h3>
        <p className="text-zinc-500 text-sm">Entrenamiento completado</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-zinc-800/60 rounded-xl p-3 flex flex-col items-center gap-1 border border-zinc-700/40">
          <Dumbbell size={15} className="text-blue-400" />
          <span className="text-white font-bold text-xl">{exercises.length}</span>
          <span className="text-zinc-500 text-xs text-center">Ejercicios</span>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3 flex flex-col items-center gap-1 border border-zinc-700/40">
          <Flame size={15} className="text-orange-400" />
          <span className="text-white font-bold text-xl">{totalSets}</span>
          <span className="text-zinc-500 text-xs text-center">Series</span>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3 flex flex-col items-center gap-1 border border-zinc-700/40">
          <Star size={15} className="text-yellow-400" />
          <span className="text-white font-bold text-xl">{Object.keys(setsByGroup).length}</span>
          <span className="text-zinc-500 text-xs text-center">Grupos</span>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-700/50 bg-zinc-900/70 p-4">
        <p className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Sets por grupo muscular</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(setsByGroup).map(([group, sets]) => (
            <div key={group} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
              <span className="text-sm text-zinc-300">{group}</span>
              <span className="text-sm font-semibold text-white">{sets} sets</span>
            </div>
          ))}
        </div>
      </div>

      {maxWeight > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <Trophy size={16} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">Peso máximo hoy: {maxWeight} kg</p>
            <p className="text-zinc-500 text-xs">Guardado en tu historial de progreso</p>
          </div>
        </div>
      )}

      {completedAt && <p className="text-center text-zinc-600 text-xs mb-4">Completado a las {completedAt}</p>}

      <div className="flex flex-col gap-2">
        <Link href="/client/progress"
          className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium text-center hover:bg-blue-500/20 transition">
          Ver mi progreso →
        </Link>
        <Link href="/client/checkin?type=daily"
          className="w-full py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium text-center hover:bg-orange-500/20 transition">
          Registrar check-in diario →
        </Link>
        {isToday && (
          <button onClick={onReset}
            className="flex items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition py-2">
            <RotateCcw size={12} /> Reiniciar entrenamiento
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function TodayWorkout({ routine, routineId, clientId }: Props) {
  const supabase = createClient()
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const todayName = dayNames[new Date().getDay()]
  const days: WorkoutDay[] = routine?.content?.days ?? []

  const todayDay: WorkoutDay | undefined = days.find((d) =>
    d.day?.toLowerCase().includes(todayName.toLowerCase())
  )
  const nextDayInfo = !todayDay && days.length > 0 ? (() => {
    const todayIdx = new Date().getDay()
    for (let i = 1; i <= 7; i++) {
      const nextName = dayNames[(todayIdx + i) % 7]
      const found = days.find((d) => d.day?.toLowerCase().includes(nextName.toLowerCase()))
      if (found) return { day: found as WorkoutDay, daysUntil: i }
    }
    return null
  })() : null

  const displayDay = todayDay ?? nextDayInfo?.day
  const isToday = !!todayDay
  const exercises: Exercise[] = displayDay?.exercises ?? []

  const [activeIndex, setActiveIndex] = useState(0)
  const [completed, setCompleted] = useState<boolean[]>(exercises.map(() => false))
  const [allLogs, setAllLogs] = useState<Record<number, SetLog[]>>({})
  const [phase, setPhase] = useState<Phase>('idle')
  const [resting, setResting] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [restForIndex, setRestForIndex] = useState(0)
  const [restTransition, setRestTransition] = useState<RestTransition>(null)
  const [workTimeLeft, setWorkTimeLeft] = useState(0)
  const [workTotal, setWorkTotal] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => Boolean(clientId && routineId && isToday))
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [autoOpenLoggerIndex, setAutoOpenLoggerIndex] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Load today's session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!clientId || !routineId || !isToday) return
    const today = new Date().toISOString().split('T')[0]
    const exCount = exercises.length

    supabase
      .from('workout_sessions')
      .select('id, completed_at')
      .eq('client_id', clientId)
      .eq('routine_id', routineId)
      .eq('date', today)
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.error('Session load error:', error)
        const session = data?.[0]
        if (session) {
          setAllDone(true)
          setWorkoutStarted(true)
          setCompleted(new Array(exCount).fill(true))
          setSessionId(session.id)
          if (session.completed_at) {
            const t = new Date(session.completed_at)
            if (!isNaN(t.getTime())) {
              setCompletedAt(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`)
            }
          }
        }
        setLoading(false)
      })
  }, [clientId, exercises.length, isToday, routineId, supabase])

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  const startExercise = (index: number, setNumber = currentSet) => {
    const workSecs = estimateWorkSeconds(exercises[index])
    setWorkoutStarted(true)
    setPhase('working')
    setCurrentSet(setNumber)
    setAutoOpenLoggerIndex(null)
    setWorkTimeLeft(workSecs)
    setWorkTotal(workSecs)
    clearTimer()
    timerRef.current = setInterval(() => {
      setWorkTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (setNumber >= exercises[index].sets) {
            setPhase('idle')
            setAutoOpenLoggerIndex(index)
          } else {
            startRestTransition({ type: 'set', exerciseIndex: index, nextSet: setNumber + 1 }, index)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startRestTransition = (transition: Exclude<RestTransition, null>, completedIndex: number) => {
    const restSecs = parseRestSeconds(exercises[completedIndex].rest)
    setResting(true)
    setRestForIndex(completedIndex)
    setRestTransition(transition)
    setRestTimeLeft(restSecs)
    setRestTotal(restSecs)
    clearTimer()
    timerRef.current = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); finishRest(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const finishRest = () => {
    setResting(false)
    const transition = restTransition
    setRestTransition(null)

    if (!transition) {
      void saveSession()
      return
    }

    if (transition.type === 'set') {
      setActiveIndex(transition.exerciseIndex)
      setCurrentSet(transition.nextSet)
      startExercise(transition.exerciseIndex, transition.nextSet)
      return
    }

    setActiveIndex(transition.nextExerciseIndex)
    setCurrentSet(1)
    setPhase('idle')
    setAutoOpenLoggerIndex(null)
    setWorkoutStarted(true)
  }

  const completeExercise = async (index: number, sets: SetLog[]) => {
    clearTimer()
    setPhase('idle')
    setWorkoutStarted(true)
    setAutoOpenLoggerIndex(null)
    setCurrentSet(1)

    const newCompleted = [...completed]
    newCompleted[index] = true
    setCompleted(newCompleted)

    const newLogs = { ...allLogs, [index]: sets }
    setAllLogs(newLogs)

    // Save exercise log — always delete first to prevent duplicates
    if (sets.length > 0 && sets.some(s => s.reps > 0)) {
      const today = new Date().toISOString().split('T')[0]
      const exerciseName = exercises[index].name.toLowerCase().trim()
      const maxWeight = Math.max(...sets.map(s => s.weight))
      const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0)

      // Delete any existing log for this exercise today
      await supabase.from('exercise_logs').delete()
        .eq('client_id', clientId)
        .eq('exercise_name', exerciseName)
        .eq('date', today)

      await supabase.from('exercise_logs').insert({
        client_id: clientId,
        workout_session_id: sessionId,
        exercise_name: exerciseName,
        date: today,
        sets_data: sets,
        max_weight: maxWeight,
        total_volume: totalVolume,
      })
    }

    const remaining = newCompleted.some(item => !item)
    const isLast = !remaining
    if (isLast) {
      await saveSession()
    } else {
      const nextExerciseIndex = getNextPendingIndex(newCompleted, index + 1)
      if (nextExerciseIndex >= 0) {
        startRestTransition({ type: 'exercise', nextExerciseIndex }, index)
      } else {
        await saveSession()
      }
    }
  }

  // ── Save session — upsert by date to prevent duplicates ────────────────────
  const saveSession = async () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    try {
      // Delete any existing session for today first (e.g. from a previous reset that didn't clean up)
      await supabase.from('workout_sessions').delete()
        .eq('client_id', clientId)
        .eq('routine_id', routineId)
        .eq('date', today)

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          client_id: clientId,
          routine_id: routineId,
          exercises_completed: exercises.length,
          exercises_total: exercises.length,
          date: today,
          completed_at: now.toISOString(),
        })
        .select('id')
        .single()

      if (error) console.error('Save session error:', error)
      if (data) setSessionId(data.id)
    } catch (e) {
      console.error('Save session exception:', e)
    }

    setResting(false)
    setCompletedAt(timeStr)
    setAllDone(true)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('treinex:workout-complete'))
    }
  }

  // ── Reset — wipe session + all exercise logs for today ─────────────────────
  const resetWorkout = async () => {
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('workout_sessions').delete()
      .eq('client_id', clientId)
      .eq('routine_id', routineId)
      .eq('date', today)

    await supabase.from('exercise_logs').delete()
      .eq('client_id', clientId)
      .eq('date', today)

    clearTimer()
    setActiveIndex(0)
    setCompleted(exercises.map(() => false))
    setAllLogs({})
    setPhase('idle')
    setAutoOpenLoggerIndex(null)
    setResting(false)
    setRestTransition(null)
    setCurrentSet(1)
    setWorkTimeLeft(0)
    setWorkTotal(0)
    setRestTimeLeft(0)
    setRestTotal(0)
    setWorkoutStarted(false)
    setAllDone(false)
    setCompletedAt(null)
    setSessionId(null)
  }

  useEffect(() => () => clearTimer(), [])

  // ── No routine ─────────────────────────────────────────────────────────────
  if (!routine) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Dumbbell size={11} className="text-blue-400" /> Mi entrenamiento
        </p>
        <Link href="/client/routine">
          <Card className="bg-zinc-900/50 border-dashed border-zinc-800 hover:border-zinc-600 transition cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                <Dumbbell size={18} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Sin rutina activa</p>
                <p className="text-zinc-600 text-xs mt-0.5">Selecciona una rutina para comenzar</p>
              </div>
              <ChevronRight size={16} className="text-zinc-700 ml-auto shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-1.5">
          <Dumbbell size={11} className="text-blue-400" /> Mi entrenamiento
        </p>
        <Link href={`/client/routine/${routineId}`}>
          <button className="text-zinc-500 text-xs hover:text-zinc-300 transition flex items-center gap-0.5">
            Ver semana <ChevronRight size={12} />
          </button>
        </Link>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge className={`text-xs ${isToday
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                  {isToday ? 'Hoy' : nextDayInfo ? `En ${nextDayInfo.daysUntil} día${nextDayInfo.daysUntil !== 1 ? 's' : ''}` : 'Próximo'}
                </Badge>
                {workoutStarted && !allDone && !resting && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs animate-pulse">En progreso</Badge>
                )}
                {resting && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs animate-pulse">Descansando</Badge>
                )}
                {allDone && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">¡Completado!</Badge>
                )}
              </div>
              {displayDay
                ? <><p className="text-white font-semibold">{displayDay.day}</p>
                    {displayDay.focus && <p className="text-zinc-400 text-xs mt-0.5">{displayDay.focus}</p>}</>
                : <p className="text-white font-semibold">Día de descanso</p>
              }
            </div>
            {!allDone && !resting && (
              <div className="flex items-center gap-2">
                {workoutStarted && isToday && (
                  <button onClick={resetWorkout}
                    className="text-zinc-600 hover:text-zinc-400 transition p-1.5 rounded-lg hover:bg-zinc-800">
                    <RotateCcw size={13} />
                  </button>
                )}
                <Link href={`/client/routine/${routineId}`}>
                  <button className="text-zinc-500 text-xs hover:text-zinc-300 transition flex items-center gap-0.5">
                    Ver todo <ChevronRight size={12} />
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : displayDay && exercises.length > 0 ? (
            allDone ? (
              <CompletionScreen
                exercises={exercises} allLogs={allLogs}
                onReset={resetWorkout} isToday={isToday} completedAt={completedAt} />
            ) : resting ? (
              <RestScreen
        nextExercise={restTransition?.type === 'exercise' ? exercises[restTransition.nextExerciseIndex] ?? null : exercises[restForIndex + 1] ?? null}
        exercise={restTransition?.type === 'set' ? exercises[restTransition.exerciseIndex] ?? null : exercises[restForIndex] ?? null}
        currentSet={restTransition?.type === 'set' ? restTransition.nextSet : 1}
        totalSets={restTransition?.type === 'set' ? exercises[restTransition.exerciseIndex]?.sets ?? currentSet : exercises[restForIndex]?.sets ?? currentSet}
        timeLeft={restTimeLeft}
        total={restTotal}
        onSkip={() => { clearTimer(); finishRest() }}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {workoutStarted && (
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(completed.filter(Boolean).length / exercises.length) * 100}%` }} />
                    </div>
                    <span className="text-zinc-500 text-xs shrink-0">
                      {completed.filter(Boolean).length}/{exercises.length}
                    </span>
                  </div>
                )}
                {exercises.map((ex, i) => (
                  <ExerciseCard key={i} exercise={ex} index={i}
                    isActive={i === activeIndex && !completed[i]}
                    isCompleted={completed[i]}
                    phase={i === activeIndex ? phase : 'idle'}
                    timeLeft={workTimeLeft}
                    totalTime={workTotal}
                    autoOpenLogger={i === autoOpenLoggerIndex}
                    currentSet={i === activeIndex ? currentSet : 1}
                    loggedSets={allLogs[i]}
                    onStart={() => startExercise(i)}
                    onLogComplete={(sets) => completeExercise(i, sets)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-xl p-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium">Día de descanso activo</p>
                <p className="text-zinc-500 text-xs mt-0.5">Estira, camina o descansa según cómo te sientas</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
