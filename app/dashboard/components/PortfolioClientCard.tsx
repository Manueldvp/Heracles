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
      <Card className="h-full rounded-3xl border-stone-200 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-orange-50">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-orange-600">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="break-words text-xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-2xl">{name}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-emerald-600">{goal}</p>
              </div>
            </div>
            <Badge className="w-fit border-stone-200 bg-stone-100 text-stone-700">{status}</Badge>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Progreso semanal</p>
              <p className="text-lg font-semibold text-stone-950">{progress}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f97316_0%,#6ee7b7_100%)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm text-stone-500">
            <span>{lastActivity}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
