'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Pencil } from 'lucide-react'

export default function NewNutritionPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Nuevo plan nutricional</h2>
      <p className="text-zinc-400 text-sm mb-8">¿Cómo quieres crear el plan?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          onClick={() => router.push(`/dashboard/clients/${clientId}/nutrition/new/ai`)}
          className="bg-zinc-900 border-zinc-800 hover:border-orange-500 transition cursor-pointer group"
        >
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition">
              <Sparkles size={28} className="text-orange-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Generar con IA</p>
              <p className="text-zinc-500 text-sm mt-1">
                La IA calcula calorías, macros y comidas según el perfil del cliente
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full mt-2">
              ⚡ Generar con IA
            </Button>
          </CardContent>
        </Card>

        <Card
          onClick={() => router.push(`/dashboard/clients/${clientId}/nutrition/new/manual`)}
          className="bg-zinc-900 border-zinc-800 hover:border-zinc-500 transition cursor-pointer group"
        >
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-700/50 flex items-center justify-center group-hover:bg-zinc-700 transition">
              <Pencil size={28} className="text-zinc-300" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Crear manualmente</p>
              <p className="text-zinc-500 text-sm mt-1">
                Define calorías, macros y arma las comidas del día con sus alimentos
              </p>
            </div>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full mt-2">
              ✏️ Crear manualmente
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}