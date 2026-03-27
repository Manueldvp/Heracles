'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function AINutritionPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/generate-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error generando el plan, intenta de nuevo.')
      setLoading(false)
      return
    }

    // Notificar al cliente
    await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: data.plan.client_id,
        clientName: data.plan.client_name ?? '',
        trainerId: data.plan.trainer_id,
        type: 'nutrition_assigned',
        message: 'Tu entrenador te asignó un nuevo plan nutricional',
      })
    })

    router.push(`/dashboard/clients/${clientId}/nutrition/${data.plan.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Generar plan nutricional con IA</h2>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles size={16} className="text-orange-400" />
            ¿Listo para generar?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-zinc-400 text-sm">
            La IA calculará las calorías, macronutrientes y comidas del día según el perfil y objetivo del cliente.
          </p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400">
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Generando...' : '⚡ Generar plan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
