import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Lock, PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { ClientSubscriptionSummary, formatSubscriptionDate } from '@/lib/client-subscriptions'

const toneClasses = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  expired: 'border-red-500/20 bg-red-500/10 text-red-400',
  paused: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  missing: 'border-border bg-muted/40 text-muted-foreground',
} as const

export default function SubscriptionStatusCard({
  summary,
  title,
  body,
  ctaHref,
  ctaLabel,
  action,
}: {
  summary: ClientSubscriptionSummary
  title: string
  body?: string
  ctaHref?: string
  ctaLabel?: string
  action?: ReactNode
}) {
  const Icon = summary.isPaused ? PauseCircle : Lock

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">{title}</p>
              <Badge className={toneClasses[summary.status]}>{summary.label}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body ?? summary.description}
            </p>
            {summary.endDate ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Vence {formatSubscriptionDate(summary.endDate)}
              </div>
            ) : null}
          </div>
        </div>

        {action ?? (ctaHref && ctaLabel ? (
          <Button asChild variant="secondary" className="shrink-0 rounded-full">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null)}
      </CardContent>
    </Card>
  )
}
