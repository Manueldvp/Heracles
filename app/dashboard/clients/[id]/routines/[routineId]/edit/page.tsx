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
import ExerciseDetails from '@/components/routines/ExerciseDetails'

interface Exercise {
  exercise_id?: string | null
  name: string
  description?: string | null
  instructions?: string[] | string | null
  sets: number
  reps: string
  rest: string
  notes: string
  image_url?: string | null
  video_url?: string | null
  media_type?: string | null
}

interface Day {
  day: string
  focus: string
  is_rest?: boolean
  rest_notes?: string
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
  const [searchResults, setSearchResults] = useState<Array<{
    exerciseId: string
    name: string
    description?: string | null
    instructions?: string[] | string | null
    imageUrl: string
    videoUrl?: string
    mediaType?: string | null
  }>>([])
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [activeDay, setActiveDay] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single()
      if (data) setRoutine(data.content as RoutineContent)

      setLoading(false)
    }
    load()
  }, [routineId, supabase])

  const searchExercises = async () => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/exercises?q=${encodeURIComponent(search)}`)
      const payload = await response.json()
      setSearchResults(Array.isArray(payload.data) ? payload.data : [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

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

  const addExercise = (
    dayIndex: number,
    exercise: {
      exerciseId?: string
      name: string
      description?: string | null
      instructions?: string[] | string | null
      imageUrl?: string
      videoUrl?: string
      mediaType?: string | null
    },
  ) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].exercises.push({
      exercise_id: exercise.exerciseId ?? null,
      name: exercise.name,
      description: exercise.description ?? null,
      instructions: exercise.instructions ?? null,
      sets: 3,
      reps: '10-12',
      rest: '60s',
      notes: '',
      image_url: exercise.imageUrl ?? null,
      video_url: exercise.videoUrl ?? null,
      media_type: exercise.mediaType ?? null,
    })
    setRoutine({ ...updated })
    setActiveDay(null)
    setSearch('')
    setSearchResults([])
  }

  const updateFocus = (dayIndex: number, value: string) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].focus = value
    setRoutine(updated)
  }

  const toggleRestDay = (dayIndex: number) => {
    if (!routine) return
    const updated = { ...routine }
    const currentDay = updated.days[dayIndex]
    currentDay.is_rest = !currentDay.is_rest
    if (currentDay.is_rest) {
      currentDay.exercises = []
    }
    setRoutine(updated)
    setActiveDay(null)
    setSearch('')
    setSearchResults([])
  }

  const updateRestNotes = (dayIndex: number, value: string) => {
    if (!routine) return
    const updated = { ...routine }
    updated.days[dayIndex].rest_notes = value
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
                  disabled={day.is_rest}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
                <Button
                  size="sm"
                  type="button"
                  variant={day.is_rest ? 'default' : 'outline'}
                  onClick={() => toggleRestDay(dayIndex)}
                  className={day.is_rest ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border-zinc-700 text-zinc-400'}
                >
                  {day.is_rest ? 'Descanso' : 'Marcar descanso'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {day.is_rest ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-300">Día de descanso</p>
                  <Input
                    value={day.rest_notes ?? ''}
                    onChange={(e) => updateRestNotes(dayIndex, e.target.value)}
                    placeholder="Ej: movilidad, paseo suave, recuperación activa"
                    className="mt-3 bg-zinc-800 border-zinc-700 text-white text-sm"
                  />
                </div>
              ) : (
                <>
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
                    <ExerciseDetails
                      description={exercise.description}
                      instructions={exercise.instructions}
                      notes={exercise.notes}
                      compact
                    />
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
                    onKeyDown={(e) => e.key === 'Enter' && void searchExercises()}
                    className="bg-zinc-700 border-zinc-600 text-white text-sm mb-2"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => void searchExercises()}
                    disabled={searching}
                    className="mb-2 w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    {searching ? 'Buscando...' : 'Buscar en base de ejercicios'}
                  </Button>
                  <div className="max-h-48 overflow-y-auto grid gap-1">
                    {searchResults.map((ex) => (
                      <button
                        key={ex.exerciseId}
                        onClick={() => addExercise(dayIndex, ex)}
                        className="text-left px-3 py-2 rounded text-zinc-300 hover:bg-zinc-600 hover:text-white text-sm transition"
                      >
                        <p>{ex.name}</p>
                        {ex.description ? (
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{ex.description}</p>
                        ) : null}
                      </button>
                    ))}
                    {!searching && search.trim() && searchResults.length === 0 && (
                      <p className="px-3 py-2 text-sm text-zinc-500">
                        Sin resultados para &quot;{search}&quot;
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setActiveDay(null); setSearch(''); setSearchResults([]) }}
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
                </>
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
