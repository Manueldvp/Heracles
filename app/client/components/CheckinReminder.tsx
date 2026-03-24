'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clientId: string
}

type ReminderType = 'daily' | 'weekly' | null

function parseMealHour(time?: string) {
  if (!time) return null
  const match = time.match(/(\d{1,2})(?::(\d{2}))?/)
  if (!match) return null
  return Number(match[1])
}

export default function CheckinReminder({ clientId }: Props) {
  const supabase = createClient()
  const [reminder, setReminder] = useState<ReminderType>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const loadReminder = async () => {
      const now = new Date()
      const hour = now.getHours()
      const today = now.toISOString().split('T')[0]
      const isSunday = now.getDay() === 0

      const [{ data: latestDaily }, { data: latestWeekly }, { data: activePlan }] = await Promise.all([
        supabase.from('checkins').select('id').eq('client_id', clientId).eq('type', 'daily').gte('created_at', `${today}T00:00:00`).maybeSingle(),
        supabase.from('checkins').select('id').eq('client_id', clientId).eq('type', 'weekly').gte('created_at', `${today}T00:00:00`).maybeSingle(),
        supabase.from('nutrition_plans').select('content').eq('client_id', clientId).eq('is_active', true).limit(1).maybeSingle(),
      ])

      const mealHours = (((activePlan?.content as { meals?: Array<{ time?: string }> } | null)?.meals) ?? [])
        .map(meal => parseMealHour(meal.time))
        .filter((value): value is number => value !== null)
      const lastMealHour = mealHours.length > 0 ? Math.max(...mealHours) : 20

      if (isSunday && !latestWeekly && !localStorage.getItem(`checkin_weekly_dismissed_${today}`)) {
        setReminder('weekly')
        setReady(true)
        return
      }

      if (!latestDaily && hour >= lastMealHour && !localStorage.getItem(`checkin_daily_dismissed_${today}`)) {
        setReminder('daily')
        setReady(true)
        return
      }

      setReady(true)
    }

    void loadReminder()
  }, [clientId, supabase])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`checkin_${reminder}_dismissed_${today}`, '1')
    setDismissed(true)
  }

  if (!ready || !reminder || dismissed) return null

  const config = reminder === 'weekly'
    ? {
        title: 'Cierra la semana con tu check-in',
        body: 'Registra cómo fue tu semana, agrega tu foto y deja contexto útil para el siguiente ajuste.',
        href: '/client/checkin?type=weekly',
        badge: 'Semanal',
      }
    : {
        title: 'Haz tu check-in después de tu última comida',
        body: 'Ya es buen momento para cerrar el día con energía, adherencia y una nota corta si hace falta.',
        href: '/client/checkin?type=daily',
        badge: 'Diario',
      }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
            Check-in {config.badge}
          </span>
          <p className="mt-3 text-sm font-medium text-white">{config.title}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{config.body}</p>
        </div>
        <button type="button" onClick={dismiss} className="text-xs text-zinc-600 hover:text-zinc-400">
          Omitir
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href={config.href} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          Completar ahora
        </Link>
        <button type="button" onClick={dismiss} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-600">
          Más tarde
        </button>
      </div>
    </div>
  )
}
