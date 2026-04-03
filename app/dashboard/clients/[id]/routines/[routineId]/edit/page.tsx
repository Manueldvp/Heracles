'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PageLoader from '@/components/ui/page-loader'
import { Trash2, Plus, GripVertical } from 'lucide-react'

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes: string
}

interface Day {
  day: string
  focus: string
  exercises: Exercise[]
}

interface RoutineContent {
  title: string
  days: Day[]
  notes: string
}

export default function EditRoutinePage() {
  const router = useRouter()
  const params = useParams()
  const { id, routineId } = params as { id: string; routineId: string }

  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [routine, setRoutine] = useState<RoutineContent | null>(null)
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [activeDay, setActiveDay] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single()
      if (data) setRoutine(data.content as RoutineContent)

      const { data: ex } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name')
      if (ex) setExercises(ex)

      setLoading(false)
    }
    load()
  }, [])

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const updateExercise = (dayIndex: number, exIndex: number, field: keyof Exercise, value: string | number) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].exercises[exIndex] = {
      ...updated.days[dayIndex].exercises[exIndex],
      [field]: field === 'sets' ? (parseInt(value as string) || 0) : value
    }
    setRoutine({ ...updated })
  }

  const removeExercise = (dayIndex: number, exIndex: number) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].exercises.splice(exIndex, 1)
    setRoutine({ ...updated })
  }

  const addExercise = (dayIndex: number, name: string) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].exercises.push({
      name,
      sets: 3,
      reps: '10-12',
      rest: '60s',
      notes: ''
    })
    setRoutine({ ...updated })
    setActiveDay(null)
    setSearch('')
  }

  const updateFocus = (dayIndex: number, value: string) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].focus = value
    setRoutine(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    const response = await fetch('/api/routines/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineId, content: routine }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'No fue posible guardar la rutina' }))
      setSaveError(payload.error ?? 'No fue posible guardar la rutina')
      setSaving(false)
      return
    }
    setSaving(false)
    router.push(`/dashboard/clients/${id}/routines/${routineId}`)
  }

  if (loading) return <PageLoader compact />
  if (!routine) return <p className="text-zinc-400">No se encontró la rutina.</p>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Editar rutina</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {saveError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {saveError}
        </p>
      ) : null}

      {/* Título */}
      <div className="mb-6">
        <Input
          value={routine.title}
          onChange={(e) => setRoutine({ ...routine, title: e.target.value })}
          className="bg-zinc-800 border-zinc-700 text-white text-lg font-semibold"
        />
      </div>

      {/* Días */}
      <div className="grid gap-4 mb-6">
        {routine.days.map((day, dayIndex) => (
          <Card key={dayIndex} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0">
                  {day.day}
                </Badge>
                <Input
                  value={day.focus}
                  onChange={(e) => updateFocus(dayIndex, e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 mb-3">
                {day.exercises.map((exercise, exIndex) => (
                  <div key={exIndex} className="bg-zinc-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical size={16} className="text-zinc-600 shrink-0" />
                      <Input
                        value={exercise.name}
                        onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white text-sm h-8 flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExercise(dayIndex, exIndex)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0 shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-zinc-500 text-xs mb-1">Series</p>
                        <Input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value))}
                          className="bg-zinc-700 border-zinc-600 text-white text-sm h-8"
                        />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-1">Reps</p>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(dayIndex, exIndex, 'reps', e.target.value)}
                          className="bg-zinc-700 border-zinc-600 text-white text-sm h-8"
                        />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-1">Descanso</p>
                        <Input
                          value={exercise.rest}
                          onChange={(e) => updateExercise(dayIndex, exIndex, 'rest', e.target.value)}
                          className="bg-zinc-700 border-zinc-600 text-white text-sm h-8"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-zinc-500 text-xs mb-1">Notas</p>
                      <Input
                        value={exercise.notes}
                        onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                        placeholder="Ej: Mantén los codos a 45 grados"
                        className="bg-zinc-700 border-zinc-600 text-white text-sm h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Agregar ejercicio */}
              {activeDay === dayIndex ? (
                <div className="bg-zinc-800 rounded-lg p-3">
                  <Input
                    placeholder="Buscar ejercicio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white text-sm mb-2"
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto grid gap-1">
                    {filteredExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(dayIndex, ex.name)}
                        className="text-left px-3 py-2 rounded text-zinc-300 hover:bg-zinc-600 hover:text-white text-sm transition"
                      >
                        {ex.name}
                      </button>
                    ))}
                    {filteredExercises.length === 0 && (
                      <button
                        onClick={() => addExercise(dayIndex, search)}
                        className="text-left px-3 py-2 rounded text-orange-400 hover:bg-zinc-600 text-sm transition"
                      >
                        + Agregar &quot;{search}&quot; como ejercicio nuevo
                      </button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setActiveDay(null); setSearch('') }}
                    className="mt-2 text-zinc-500 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveDay(dayIndex)}
                  className="border-zinc-700 text-zinc-400 hover:text-white w-full"
                >
                  <Plus size={14} className="mr-1" /> Agregar ejercicio
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notas generales */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">📋 Recomendaciones generales</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={routine.notes}
            onChange={(e) => setRoutine({ ...routine, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
          />
        </CardContent>
      </Card>
    </div>
  )
}
