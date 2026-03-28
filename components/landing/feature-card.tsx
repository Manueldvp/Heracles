import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  title: string
  copy: string
  icon: LucideIcon
  image?: string
  accent?: 'orange' | 'neutral'
}

export default function FeatureCard({ title, copy, icon: Icon, image, accent = 'neutral' }: Props) {
  const accentClasses = accent === 'orange'
    ? 'border-primary/20 bg-primary/10 text-foreground'
    : 'bg-card border-border'

  const iconClasses = accent === 'orange'
    ? 'bg-transparent text-primary'
    : 'bg-transparent text-primary'

  const copyClasses = 'text-muted-foreground'

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${accentClasses}`}>
      <CardContent className="p-0">
        {image ? (
          <div
            className="h-48 w-full border-b border-border bg-cover bg-center transition duration-300 group-hover:scale-[1.01]"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : null}
        <div className="p-8">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
        <p className={`mt-4 text-sm leading-7 ${copyClasses}`}>{copy}</p>
        </div>
      </CardContent>
    </Card>
  )
}
