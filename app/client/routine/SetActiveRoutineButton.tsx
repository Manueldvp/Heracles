'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { setActiveRoutine } from '@/lib/supabase/rpc'

export default function SetActiveRoutineButton({
  routineId,
}: {
  routineId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSetActive = async () => {
    setLoading(true)
    const { error } = await setActiveRoutine(supabase, routineId)
    if (error) {
      console.error('set_active_routine failed', error)
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSetActive}
      disabled={loading}
      className="border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-400 text-xs"
    >
      {loading ? '...' : 'Activar'}
    </Button>
  )
}
