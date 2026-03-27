'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function AIRoutinePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/generate-routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error generando la rutina, intenta de nuevo.')
      setLoading(false)
      return
    }

    // Notificar al cliente
    await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: data.routine.client_id,
        clientName: data.routine.client_name ?? '',
        trainerId: data.routine.trainer_id,
        type: 'routine_assigned',
        message: 'Tu entrenador te asignó una nueva rutina',
      })
    })

    router.push(`/dashboard/clients/${clientId}/routines/${data.routine.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Generar rutina con IA</h2>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles size={16} className="text-orange-400" />
            ¿Listo para generar?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-zinc-400 text-sm">
            La IA analizará el perfil del cliente — objetivo, nivel, restricciones y peso —
            para generar una rutina semanal completamente personalizada.
          </p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-zinc-700 text-zinc-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? 'Generando...' : '⚡ Generar rutina'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
