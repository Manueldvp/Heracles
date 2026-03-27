import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  compact?: boolean
}

export default function PageLoader({ className, compact = false }: Props) {
  return (
    <div className={cn(
      'flex min-h-[40vh] items-center justify-center px-6 py-12',
      className
    )}>
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Cargando Treinex</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {compact ? 'Preparando la vista...' : 'Estamos preparando la siguiente pantalla para ti.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
