import Link from 'next/link'
import { CalendarClock, ChevronRight, Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = {
  href: string
  name: string
  subtitle: string
  status: 'active' | 'pending' | 'expired'
  lastActivity: string
  avatarUrl?: string | null
  note?: string
}

const statusConfig = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  pending: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
  expired: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
} as const

export default function ClientGridCard({
  href,
  name,
  subtitle,
  status,
  lastActivity,
  avatarUrl,
  note,
}: Props) {
  const Icon = status === 'active' ? Clock3 : CalendarClock

  return (
    <Link href={href}>
      <Card className="h-full border-zinc-800 bg-[#151c31] transition hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-orange-500/15 bg-zinc-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-orange-200">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold tracking-[-0.04em] text-white">{name}</p>
                <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
              </div>
            </div>
            <Badge className={statusConfig[status]}>
              {status === 'active' ? 'Activo' : status === 'pending' ? 'Pendiente' : 'Expirado'}
            </Badge>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
            <Icon className="h-4 w-4 text-zinc-500" />
            <span>{lastActivity}</span>
          </div>

          {note ? (
            <p className="mt-3 text-sm text-zinc-500">{note}</p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
