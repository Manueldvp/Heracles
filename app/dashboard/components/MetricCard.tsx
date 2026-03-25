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
    value: 'text-white',
    helper: 'text-emerald-300',
    icon: 'bg-white/5 text-zinc-300',
  },
  orange: {
    value: 'text-white',
    helper: 'text-orange-200',
    icon: 'bg-orange-500/10 text-orange-300',
  },
  rose: {
    value: 'text-rose-200',
    helper: 'text-rose-300',
    icon: 'bg-rose-500/10 text-rose-300',
  },
}

export default function MetricCard({ label, value, helper, icon: Icon, tone = 'default' }: Props) {
  const classes = toneClasses[tone]

  return (
    <Card className="border-zinc-800 bg-[#151c31] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${classes.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={`text-5xl font-semibold tracking-[-0.06em] ${classes.value}`}>{value}</p>
        <p className={`text-sm ${classes.helper}`}>{helper}</p>
      </CardContent>
    </Card>
  )
}
