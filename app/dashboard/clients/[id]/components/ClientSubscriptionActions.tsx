'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  activateClientSubscription,
  cancelClientSubscription,
  renewClientSubscription,
} from '@/lib/supabase/rpc'
import { ClientSubscriptionSummary } from '@/lib/client-subscriptions'

export default function ClientSubscriptionActions({
  clientId,
  summary,
}: {
  clientId: string
  summary: ClientSubscriptionSummary
}) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const runAction = (task: () => Promise<{ error: { message?: string } | null }>) => {
    setError(null)

    startTransition(async () => {
      const result = await task()

      if (result.error) {
        setError(result.error.message ?? 'No fue posible actualizar la suscripcion.')
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {summary.isActive ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={isPending}
              onClick={() => runAction(() => renewClientSubscription(supabase, clientId, 30))}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sumar 30 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isPending}
              onClick={() => runAction(() => cancelClientSubscription(supabase, clientId))}
            >
              Pausar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className="rounded-full"
            disabled={isPending}
            onClick={() => runAction(() => activateClientSubscription(supabase, clientId, 30))}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activar 30 dias
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
