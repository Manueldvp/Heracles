'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { setActiveNutrition } from '@/lib/supabase/rpc'

export default function SetActiveNutritionButton({
  planId,
}: {
  planId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSetActive = async () => {
    setLoading(true)
    const { error } = await setActiveNutrition(supabase, planId)
    if (error) {
      console.error('set_active_nutrition failed', error)
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
