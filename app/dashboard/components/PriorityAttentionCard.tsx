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
    card: 'border-rose-500/20 bg-[#201621]',
    icon: 'bg-rose-500/12 text-rose-300',
    text: 'text-rose-200',
    button: 'bg-[#ffb29a] text-[#3a1f1b] hover:bg-[#ffbea9]',
    Icon: AlertTriangle,
  },
  slate: {
    card: 'border-zinc-700 bg-[#232b3f]',
    icon: 'bg-emerald-500/10 text-emerald-300',
    text: 'text-zinc-300',
    button: 'bg-[#ffb29a] text-[#3a1f1b] hover:bg-[#ffbea9]',
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
    <Card className={`${config.card} transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.26)]`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold tracking-[-0.04em] text-white">{name}</p>
          <p className={`mt-1 text-base ${config.text}`}>{detail}</p>
        </div>
        <Link href={href}>
          <Button className={`${config.button} h-10 rounded-xl px-4 text-sm font-semibold`}>{actionLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
