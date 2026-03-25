import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone?: 'default' | 'orange' | 'rose'
}

const toneClasses = {
  default: {
    value: 'text-stone-950',
    helper: 'text-emerald-600',
    icon: 'bg-stone-100 text-stone-600',
  },
  orange: {
    value: 'text-stone-950',
    helper: 'text-orange-600',
    icon: 'bg-orange-50 text-orange-600',
  },
  rose: {
    value: 'text-rose-600',
    helper: 'text-rose-500',
    icon: 'bg-rose-50 text-rose-500',
  },
}

export default function MetricCard({ label, value, helper, icon: Icon, tone = 'default' }: Props) {
  const classes = toneClasses[tone]

  return (
    <Card className="h-full rounded-3xl border-stone-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${classes.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={`text-4xl font-semibold tracking-[-0.06em] sm:text-5xl ${classes.value}`}>{value}</p>
        <p className={`text-sm ${classes.helper}`}>{helper}</p>
      </CardContent>
    </Card>
  )
}
