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
      <div className={cn(
        'flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[0_14px_34px_rgba(249,115,22,0.18)]',
        compact ? 'h-14 w-14' : 'h-16 w-16'
      )}>
        <div className={cn(
          'rounded-full border-2 border-primary/20 border-t-primary animate-spin',
          compact ? 'h-7 w-7' : 'h-8 w-8'
        )} />
      </div>
    </div>
  )
}
