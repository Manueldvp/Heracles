import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  title: string
  copy: string
  icon: LucideIcon
  accent?: 'orange' | 'neutral'
}

export default function FeatureCard({ title, copy, icon: Icon, accent = 'neutral' }: Props) {
  const accentClasses = accent === 'orange'
    ? 'bg-orange-500 text-white border-orange-400/20'
    : 'bg-zinc-950/85 border-zinc-800'

  const iconClasses = accent === 'orange'
    ? 'bg-white/10 text-white'
    : 'bg-orange-500/10 text-orange-300'

  const copyClasses = accent === 'orange' ? 'text-white/85' : 'text-zinc-400'

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${accentClasses}`}>
      <CardContent className="p-8">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${iconClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
        <p className={`mt-4 text-sm leading-7 ${copyClasses}`}>{copy}</p>
      </CardContent>
    </Card>
  )
}
