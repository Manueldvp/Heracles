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
      <Card className="h-full border-zinc-800 bg-[#151c31] transition hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-orange-500/15 bg-zinc-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-orange-200">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-white">{name}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-emerald-300">{goal}</p>
              </div>
            </div>
            <Badge className="border-zinc-700 bg-zinc-900 text-zinc-300">{status}</Badge>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Progreso semanal</p>
              <p className="text-lg font-semibold text-white">{progress}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f97316_0%,#6ee7b7_100%)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
            <span>{lastActivity}</span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
