import { APP_NAME } from '@/lib/branding'
import { cn } from '@/lib/utils'

type Props = {
  subtitle?: string
  className?: string
  compact?: boolean
}

export default function BrandLockup({ subtitle, className, compact = false }: Props) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className={cn(
        'rounded-2xl border border-border bg-card',
        compact ? 'h-9 w-9' : 'h-11 w-11'
      )} />
      <div className="min-w-0">
        <p className={cn(
          'truncate font-semibold tracking-[-0.04em] text-foreground',
          compact ? 'text-lg' : 'text-xl'
        )}>
          {APP_NAME}
        </p>
        {subtitle ? (
          <p className="truncate text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
