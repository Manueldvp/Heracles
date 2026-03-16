'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Salad, ChevronRight, Clock, CheckCircle, Flame, Beef } from 'lucide-react'
import Link from 'next/link'

interface Food {
  name: string
  amount: string
  calories: number
  protein_g?: number
  notes?: string
}

interface Meal {
  name: string
  time: string
  foods: Food[]
  calories?: number
}

interface Props {
  plan: any
  planId: string
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default function TodayMeal({ plan, planId }: Props) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes())
    }, 60000) // actualiza cada minuto
    return () => clearInterval(interval)
  }, [])

  const content = plan.content as any
  const meals: Meal[] = content.meals ?? []

  if (!meals.length) return null

  // Determina qué comida mostrar
  const mealsWithMinutes = meals.map(m => ({
    ...m,
    minutes: parseMinutes(m.time),
  }))

  // Comida actual: la más reciente cuyo tiempo ya pasó pero la siguiente aún no
  let activeMeal: (typeof mealsWithMinutes[0]) | null = null
  let mealStatus: 'current' | 'next' | 'last' = 'next'

  const upcoming = mealsWithMinutes.filter(m => m.minutes > currentMinutes)
  const past = mealsWithMinutes.filter(m => m.minutes <= currentMinutes)

  if (upcoming.length > 0) {
    const nextMeal = upcoming[0]
    const minutesUntil = nextMeal.minutes - currentMinutes

    // Si la próxima comida es en menos de 30min, ya la mostramos como "próxima inminente"
    // Si hay una comida en curso (pasó hace menos de 90min), mostrar esa
    if (past.length > 0) {
      const lastPast = past[past.length - 1]
      const minutesSince = currentMinutes - lastPast.minutes
      if (minutesSince < 90) {
        activeMeal = lastPast
        mealStatus = 'current'
      } else {
        activeMeal = nextMeal
        mealStatus = 'next'
      }
    } else {
      activeMeal = nextMeal
      mealStatus = 'next'
    }
  } else {
    // Ya pasaron todas las comidas
    activeMeal = mealsWithMinutes[mealsWithMinutes.length - 1]
    mealStatus = 'last'
  }

  if (!activeMeal) return null

  const minutesUntil = activeMeal.minutes - currentMinutes
  const hoursUntil = Math.floor(Math.abs(minutesUntil) / 60)
  const minsUntil = Math.abs(minutesUntil) % 60

  const timeLabel = mealStatus === 'current'
    ? 'Ahora'
    : mealStatus === 'last'
    ? 'Última comida del día'
    : hoursUntil > 0
    ? `En ${hoursUntil}h ${minsUntil > 0 ? `${minsUntil}min` : ''}`
    : `En ${minsUntil}min`

  const statusColor = mealStatus === 'current'
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : mealStatus === 'last'
    ? 'bg-zinc-700 text-zinc-400 border-zinc-600'
    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-1.5">
          <Salad size={11} className="text-green-400" /> Mi alimentación
        </p>
        <Link href={`/client/nutrition/${planId}`}>
          <button className="text-zinc-500 text-xs hover:text-zinc-300 transition flex items-center gap-0.5">
            Plan completo <ChevronRight size={12} />
          </button>
        </Link>
      </div>

      <Link href={`/client/nutrition/${planId}`}>
        <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500/30 transition cursor-pointer">
          <CardContent className="p-5">
            {/* Header comida activa */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge className={`text-xs ${statusColor}`}>
                    {timeLabel}
                  </Badge>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Clock size={10} />
                    <span>{activeMeal.time}</span>
                  </div>
                </div>
                <p className="text-white font-semibold">{activeMeal.name}</p>
                {activeMeal.calories && (
                  <p className="text-zinc-500 text-xs mt-0.5">{activeMeal.calories} kcal</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {[
                  { key: 'protein_g', label: 'P', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                  { key: 'carbs_g',   label: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                  { key: 'fat_g',     label: 'G', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                ].map(({ key, label, color, bg }) => {
                  const val = content.macros?.[key] ?? content[key] ?? 0
                  const perMeal = meals.length > 0 ? Math.round(val / meals.length) : 0
                  return (
                    <div key={key} className={`${bg} border rounded-xl w-11 h-11 flex flex-col items-center justify-center`}>
                      <p className={`${color} text-xs font-bold leading-none`}>{perMeal}g</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alimentos */}
            <div className="flex flex-col gap-2">
              {activeMeal.foods.map((food, i) => (
                <div key={i} className="flex items-center gap-3 bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Beef size={13} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{food.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">{food.amount}</span>
                      {food.notes && (
                        <span className="text-zinc-600 text-xs truncate">· {food.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {food.calories > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Flame size={9} className="text-orange-400" />
                        <span className="text-orange-400 text-xs font-medium">{food.calories}</span>
                      </div>
                    )}
                    {(food.protein_g ?? 0) > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Beef size={9} className="text-red-400" />
                        <span className="text-red-400 text-xs">{food.protein_g}g</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini timeline de comidas */}
            <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {mealsWithMinutes.map((m, i) => {
                const isPast = m.minutes < currentMinutes
                const isActive = m.name === activeMeal!.name
                return (
                  <div key={i} className={`flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition ${
                    isActive
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : isPast
                      ? 'bg-zinc-800/40 border-zinc-700/30 text-zinc-600'
                      : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-500'
                  }`}>
                    {isPast && !isActive && <CheckCircle size={10} className="text-zinc-600" />}
                    <span className="font-medium truncate max-w-[64px]">{m.name.split(' ')[0]}</span>
                    <span className={isPast && !isActive ? 'text-zinc-700' : ''}>{m.time}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
