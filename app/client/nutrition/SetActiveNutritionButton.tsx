'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SetActiveNutritionButton({
  planId,
  clientId,
}: {
  planId: string
  clientId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSetActive = async () => {
    setLoading(true)
    await supabase
      .from('nutrition_plans')
      .update({ is_active: false })
      .eq('client_id', clientId)

    await supabase
      .from('nutrition_plans')
      .update({ is_active: true })
      .eq('id', planId)

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