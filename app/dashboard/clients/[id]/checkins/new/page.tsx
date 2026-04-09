'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function RatingSelector({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-lg font-semibold transition text-sm ${
            value === n
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function NewCheckinPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    energy_level: 3,
    sleep_quality: 3,
    completed_workouts: 0,
    weight: '',
    notes: '',
  })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const parsedWeight = form.weight ? parseFloat(form.weight) : null

    const { error } = await supabase.from('checkins').insert({
      client_id: clientId,
      energy_level: form.energy_level,
      sleep_quality: form.sleep_quality,
      completed_workouts: form.completed_workouts,
      weight: parsedWeight,
      notes: form.notes,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (parsedWeight !== null) {
      const { error: updateWeightError } = await supabase
        .from('clients')
        .update({ weight: parsedWeight })
        .eq('id', clientId)

      if (updateWeightError) {
        console.error('Client weight sync error:', updateWeightError)
      }
    }

    router.push(`/dashboard/clients/${clientId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Nuevo check-in semanal</h2>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">¿Cómo estuvo la semana?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Nivel de energía general</Label>
            <RatingSelector
              value={form.energy_level}
              onChange={(v) => setForm({ ...form, energy_level: v })}
            />
            <p className="text-zinc-600 text-xs">1 = Muy bajo · 5 = Excelente</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Calidad del sueño</Label>
            <RatingSelector
              value={form.sleep_quality}
              onChange={(v) => setForm({ ...form, sleep_quality: v })}
            />
            <p className="text-zinc-600 text-xs">1 = Muy malo · 5 = Excelente</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Entrenamientos completados esta semana</Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm({ ...form, completed_workouts: n })}
                  className={`w-10 h-10 rounded-lg font-semibold transition text-sm ${
                    form.completed_workouts === n
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Peso actual (kg) — opcional</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="75.5"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white max-w-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Notas adicionales — opcional</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Tuve dolor de rodilla el martes, no dormí bien por estrés..."
              rows={3}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 resize-none text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Guardando...' : 'Registrar check-in'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
