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
    value: 'text-foreground',
    helper: 'text-muted-foreground',
    icon: 'bg-transparent text-muted-foreground',
  },
  orange: {
    value: 'text-foreground',
    helper: 'text-primary',
    icon: 'bg-primary/10 text-primary',
  },
  rose: {
    value: 'text-red-400',
    helper: 'text-red-400',
    icon: 'bg-red-500/10 text-red-400',
  },
}

export default function MetricCard({ label, value, helper, icon: Icon, tone = 'default' }: Props) {
  const classes = toneClasses[tone]

  return (
    <Card className="h-full rounded-xl border border-border bg-card shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border ${classes.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={`text-2xl font-bold tracking-[-0.04em] sm:text-3xl ${classes.value}`}>{value}</p>
        <p className={`text-sm ${classes.helper}`}>{helper}</p>
      </CardContent>
    </Card>
  )
}
