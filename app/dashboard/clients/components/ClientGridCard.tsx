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
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-orange-200 bg-orange-50 text-orange-700',
  expired: 'border-rose-200 bg-rose-50 text-rose-700',
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
      <Card className="h-full rounded-3xl border-stone-200 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-orange-50">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-orange-600">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold tracking-[-0.04em] text-stone-950">{name}</p>
                <p className="mt-1 break-words text-sm text-stone-500">{subtitle}</p>
              </div>
            </div>
            <Badge className={`w-fit ${statusConfig[status]}`}>
              {status === 'active' ? 'Activo' : status === 'pending' ? 'Pendiente' : 'Expirado'}
            </Badge>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-stone-500">
            <Icon className="h-4 w-4 text-stone-400" />
            <span>{lastActivity}</span>
          </div>

          {note ? (
            <p className="mt-3 text-sm text-stone-500">{note}</p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <ChevronRight className="h-4 w-4 text-stone-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
