'use client'

import { useState, useEffect } from 'react'
import { X, ClipboardList, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clientId: string
}

type ReminderType = 'daily_morning' | 'daily_evening' | 'weekly' | null

export default function CheckinReminder({ clientId }: Props) {
  const [reminder, setReminder] = useState<ReminderType>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const now = new Date()
      const hour = now.getHours()
      const isSunday = now.getDay() === 0
      const today = now.toISOString().split('T')[0]

      const dailyDismissKey = `checkin_dismissed_${today}`
      const weeklyDismissKey = `checkin_weekly_dismissed_${today}`

      // Semanal: domingos primero
      if (isSunday && !localStorage.getItem(weeklyDismissKey)) {
        const { data } = await supabase
          .from('checkins')
          .select('id')
          .eq('client_id', clientId)
          .eq('type', 'weekly')
          .gte('created_at', `${today}T00:00:00`)
          .maybeSingle()
        if (!data) { setReminder('weekly'); setReady(true); return }
      }

      // Diario por horario
      if (!localStorage.getItem(dailyDismissKey)) {
        const { data } = await supabase
          .from('checkins')
          .select('id')
          .eq('client_id', clientId)
          .eq('type', 'daily')
          .gte('created_at', `${today}T00:00:00`)
          .maybeSingle()

        if (!data) {
          if (hour >= 6 && hour < 12) { setReminder('daily_morning'); setReady(true); return }
          if (hour >= 20 && hour <= 23) { setReminder('daily_evening'); setReady(true); return }
        }
      }

      setReady(true)
    }

    check()
  }, [clientId])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    if (reminder === 'weekly') {
      localStorage.setItem(`checkin_weekly_dismissed_${today}`, '1')
    } else {
      localStorage.setItem(`checkin_dismissed_${today}`, '1')
    }
    setDismissed(true)
  }

  if (!ready || !reminder || dismissed) return null

  const configs = {
    daily_morning: {
      Icon: ClipboardList,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      border: 'border-orange-500/20',
      glowColor: 'via-orange-500/40',
      badge: 'Check-in diario',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      title: '¡Buenos días! ¿Cómo empezaste el día?',
      subtitle: 'Registra tu energía y sueño. Solo toma 1 minuto.',
      btnColor: 'bg-orange-500 hover:bg-orange-600',
      type: 'daily',
    },
    daily_evening: {
      Icon: ClipboardList,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/20',
      glowColor: 'via-blue-500/40',
      badge: 'Check-in diario',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      title: '¿Cómo fue tu día hoy?',
      subtitle: 'Cuéntale a tu entrenador cómo terminaste el día.',
      btnColor: 'bg-blue-500 hover:bg-blue-600',
      type: 'daily',
    },
    weekly: {
      Icon: Calendar,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      border: 'border-purple-500/20',
      glowColor: 'via-purple-500/40',
      badge: 'Check-in semanal',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      title: '¡Es domingo! Hora del check-in semanal',
      subtitle: 'Revisa tu semana con tu entrenador. Pesa, refleja, avanza.',
      btnColor: 'bg-purple-500 hover:bg-purple-600',
      type: 'weekly',
    },
  }

  const config = configs[reminder]
  const { Icon } = config

  return (
    <div
      className={`rounded-2xl border p-4 relative overflow-hidden ${config.border}`}
      style={{ background: 'rgba(255,255,255,0.03)', animation: 'slideUp 0.35s ease-out' }}
    >
      {/* Top glow line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${config.glowColor} to-transparent`} />

      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-400 transition p-1 rounded-lg hover:bg-zinc-800/60">
        <X size={13} />
      </button>

      <div className="flex items-start gap-3 pr-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
          <Icon size={18} className={config.iconColor} />
        </div>

        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium mb-1.5 ${config.badgeColor}`}>
            {config.badge}
          </span>
          <p className="text-white text-sm font-semibold leading-snug">{config.title}</p>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{config.subtitle}</p>

          <div className="flex items-center gap-2 mt-3">
            <Link
              href={`/client/checkin?type=${config.type}`}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition text-white ${config.btnColor}`}>
              Hacer check-in →
            </Link>
            <button
              onClick={dismiss}
              className="text-zinc-600 hover:text-zinc-400 text-xs transition px-2 py-2">
              Omitir por hoy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
