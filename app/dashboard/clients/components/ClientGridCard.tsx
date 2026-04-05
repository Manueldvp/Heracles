import Link from 'next/link'
import { CalendarClock, ChevronRight, Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = {
  href: string
  name: string
  subtitle: string
  status: 'active' | 'pending' | 'expired'
  subscriptionBadge?: {
    label: string
    tone: 'success' | 'warning' | 'danger' | 'muted'
  } | null
  lastActivity: string
  avatarUrl?: string | null
  note?: string
}

const statusConfig = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  pending: 'border-primary/20 bg-primary/10 text-primary',
  expired: 'border-red-500/20 bg-red-500/10 text-red-400',
} as const

const subscriptionBadgeConfig = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  danger: 'border-red-500/20 bg-red-500/10 text-red-400',
  muted: 'border-border bg-muted/60 text-muted-foreground',
} as const

export default function ClientGridCard({
  href,
  name,
  subtitle,
  status,
  subscriptionBadge,
  lastActivity,
  avatarUrl,
  note,
}: Props) {
  const Icon = status === 'active' ? Clock3 : CalendarClock

  return (
    <Link href={href}>
      <Card className="h-full rounded-xl border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-primary">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold tracking-[-0.04em] text-foreground">{name}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Badge className={`w-fit ${statusConfig[status]}`}>
                {status === 'active' ? 'Activo' : status === 'pending' ? 'Pendiente' : 'Expirado'}
              </Badge>
              {subscriptionBadge ? (
                <Badge className={`w-fit ${subscriptionBadgeConfig[subscriptionBadge.tone]}`}>
                  {subscriptionBadge.label}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{lastActivity}</span>
          </div>

          {note ? (
            <p className="mt-3 text-sm text-muted-foreground">{note}</p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
