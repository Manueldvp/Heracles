import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = {
  href: string
  name: string
  goal: string
  status: string
  progress: number
  lastActivity: string
  avatarUrl?: string | null
}

export default function PortfolioClientCard({
  href,
  name,
  goal,
  status,
  progress,
  lastActivity,
  avatarUrl,
}: Props) {
  return (
    <Link href={href}>
      <Card className="h-full rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-primary">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold tracking-[-0.04em] text-foreground sm:text-xl">{name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{goal}</p>
              </div>
            </div>
            <Badge className="w-fit">{status}</Badge>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Progreso semanal</p>
              <p className="text-lg font-semibold text-foreground">{progress}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{lastActivity}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
