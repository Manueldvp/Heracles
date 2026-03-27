import Link from 'next/link'
import { AlertTriangle, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = {
  href: string
  name: string
  detail: string
  actionLabel: string
  tone?: 'rose' | 'slate'
}

const toneConfig = {
  rose: {
    card: 'border-red-500/20 bg-red-500/10',
    icon: 'bg-transparent text-red-400',
    text: 'text-red-400',
    button: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    Icon: AlertTriangle,
  },
  slate: {
    card: 'border-border bg-card',
    icon: 'bg-transparent text-primary',
    text: 'text-muted-foreground',
    button: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    Icon: Dumbbell,
  },
} as const

export default function PriorityAttentionCard({
  href,
  name,
  detail,
  actionLabel,
  tone = 'slate',
}: Props) {
  const config = toneConfig[tone]
  const Icon = config.Icon

  return (
    <Card className={`${config.card} h-full rounded-xl transition hover:-translate-y-0.5 hover:shadow-md`}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-current/10 ${config.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">{name}</p>
          <p className={`mt-1 text-sm ${config.text}`}>{detail}</p>
        </div>
        <Link href={href} className="sm:ml-auto">
          <Button className={`${config.button} h-10 rounded-xl px-4 text-sm font-semibold`}>{actionLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
