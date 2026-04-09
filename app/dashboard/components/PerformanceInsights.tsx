import { Activity, BarChart3, ClipboardCheck, Salad, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Metric = {
  label: string
  value: string
  helper: string
  ratio: number
  icon: 'retention' | 'checkins' | 'energy' | 'routine' | 'nutrition' | 'objectives'
}

const iconMap = {
  retention: TrendingUp,
  checkins: ClipboardCheck,
  energy: Activity,
  routine: Target,
  nutrition: Salad,
  objectives: Target,
} as const

export default function PerformanceInsights({ metrics }: { metrics: Metric[] }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Indicadores de rendimiento</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = iconMap[metric.icon]
            return (
              <div key={metric.label} className="rounded-xl border border-border bg-muted/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(6, Math.min(100, metric.ratio * 100))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
