import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

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
      <div className="w-full max-w-md rounded-[28px] border border-zinc-900 bg-zinc-950/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10">
            <LoaderCircle className="h-5 w-5 animate-spin text-orange-400" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20 bg-zinc-900" />
          </div>
        </div>

        <div className={cn('mt-6 space-y-3', compact ? 'space-y-2' : 'space-y-3')}>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          {!compact ? <Skeleton className="h-24 w-full rounded-3xl bg-zinc-900" /> : null}
        </div>
      </div>
    </div>
  )
}
