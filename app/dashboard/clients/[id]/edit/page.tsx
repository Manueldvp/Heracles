'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageLoader from '@/components/ui/page-loader'

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    age: '',
    weight: '',
    height: '',
    goal: 'muscle_gain',
    level: 'beginner',
    restrictions: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name || '',
          email: data.email || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          goal: data.goal || 'muscle_gain',
          level: data.level || 'beginner',
          restrictions: data.restrictions || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('clients')
      .update({
        ...form,
        age: parseInt(form.age),
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push(`/dashboard/clients/${id}`)
  }

  if (loading) return <PageLoader compact />

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Editar cliente</h2>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Información del cliente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Nombre completo</Label>
              <Input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Email</Label>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Edad</Label>
              <Input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Peso (kg)</Label>
              <Input
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Altura (cm)</Label>
              <Input
                name="height"
                type="number"
                value={form.height}
                onChange={handleChange}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Objetivo</Label>
              <select
                name="goal"
                value={form.goal}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="muscle_gain">Ganancia muscular</option>
                <option value="fat_loss">Pérdida de grasa</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="strength">Fuerza</option>
                <option value="endurance">Resistencia</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Nivel</Label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Restricciones / lesiones / alergias</Label>
            <textarea
              name="restrictions"
              value={form.restrictions}
              onChange={handleChange}
              rows={3}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

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
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
