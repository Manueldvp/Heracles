'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SetActiveRoutineButton({
  routineId,
  clientId,
}: {
  routineId: string
  clientId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSetActive = async () => {
    setLoading(true)

    // Desactivar todas las rutinas del cliente
    await supabase
      .from('routines')
      .update({ is_active: false })
      .eq('client_id', clientId)

    // Activar la seleccionada
    await supabase
      .from('routines')
      .update({ is_active: true })
      .eq('id', routineId)

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