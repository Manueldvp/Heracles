'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Search, X } from 'lucide-react'

interface Exercise {
  exerciseId: string
  name: string
  imageUrl: string
  videoUrl?: string
  mediaType?: string
}

interface RoutineExercise {
  exerciseId: string
  name: string
  imageUrl: string
  videoUrl?: string
  mediaType?: string
  sets: number
  reps: string
  rest: string
  notes: string
}

interface Day {
  name: string
  exercises: RoutineExercise[]
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function ManualRoutinePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [days, setDays] = useState<Day[]>([{ name: 'Lunes', exercises: [] }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [searching, setSearching] = useState(false)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [exForm, setExForm] = useState({ sets: 3, reps: '10', rest: '60s', notes: '' })

  const searchExercises = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/exercises?q=${encodeURIComponent(search)}`)
      const json = await res.json()
      setSearchResults(json.data ?? [])
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }

  const addDay = () => {
    const next = DAY_NAMES[days.length % 7]
    setDays([...days, { name: next, exercises: [] }])
  }

  const removeDay = (i: number) => {
    setDays(days.filter((_, idx) => idx !== i))
  }

  const addExerciseToDay = () => {
    if (!selectedExercise || activeDayIndex === null) return
    const newEx: RoutineExercise = {
      exerciseId: selectedExercise.exerciseId,
      name: selectedExercise.name,
      imageUrl: selectedExercise.imageUrl,
      videoUrl: selectedExercise.videoUrl,
      mediaType: selectedExercise.mediaType,
      ...exForm,
    }
    const updated = [...days]
    updated[activeDayIndex].exercises.push(newEx)
    setDays(updated)
    setSelectedExercise(null)
    setSearch('')
    setSearchResults([])
    setExForm({ sets: 3, reps: '10', rest: '60s', notes: '' })
  }

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const updated = [...days]
    updated[dayIdx].exercises.splice(exIdx, 1)
    setDays(updated)
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Agrega un título a la rutina'); return }
    if (days.every(d => d.exercises.length === 0)) { setError('Agrega al menos un ejercicio'); return }

    setSaving(true)
    setError('')

    const content = {
      title,
      days: days.map(d => ({
        day: d.name,
        exercises: d.exercises.map(e => ({
          name: e.name,
          image_url: e.imageUrl,
          video_url: e.videoUrl,
          media_type: e.mediaType,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          notes: e.notes,
        }))
      }))
    }

    const { data: { user } } = await supabase.auth.getUser()
    const response = await fetch('/api/routines/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, title, content }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error ?? 'No fue posible guardar la rutina')
      setSaving(false)
      return
    }

    const routine = payload.routine as { id: string; title?: string }

    // Notificar al cliente
   
      await fetch('/api/notify-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          clientName: routine.title ?? '',
          trainerId: user?.id ?? '',
          type: 'routine_assigned',
          message: 'Tu entrenador te asignó una nueva rutina',
        })
      })

    router.push(`/dashboard/clients/${clientId}/routines/${routine.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6">Crear rutina manualmente</h2>

      {/* Título */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardContent className="pt-4 pb-4">
          <Label className="text-zinc-400">Título de la rutina</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Rutina de fuerza — Semana 1"
            className="bg-zinc-800 border-zinc-700 text-white mt-2"
          />
        </CardContent>
      </Card>

      {/* Días */}
      {days.map((day, dayIdx) => (
        <Card key={dayIdx} className="bg-zinc-900 border-zinc-800 mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">{day.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-400 text-xs"
                onClick={() => setActiveDayIndex(activeDayIndex === dayIdx ? null : dayIdx)}
              >
                <Search size={13} className="mr-1" />
                Agregar ejercicio
              </Button>
              {days.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeDay(dayIdx)}
                  className="border-red-800 text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>

            {/* Ejercicios del día */}
            {day.exercises.length === 0 ? (
              <p className="text-zinc-600 text-sm">Sin ejercicios aún.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                    <img
                      src={ex.imageUrl}
                      alt={ex.name}
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium capitalize truncate">{ex.name}</p>
                      <p className="text-zinc-500 text-xs">{ex.sets} series × {ex.reps} reps · {ex.rest}</p>
                      {ex.notes && <p className="text-zinc-600 text-xs mt-0.5">💬 {ex.notes}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExercise(dayIdx, exIdx)}
                      className="text-red-400 hover:bg-red-400/10 shrink-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Buscador inline */}
            {activeDayIndex === dayIdx && (
              <div className="border border-zinc-700 rounded-xl p-4 mt-2 flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchExercises()}
                    placeholder="Buscar en inglés (ej: squat, bench press, curl...)"
                    className="bg-zinc-800 border-zinc-700 text-white flex-1"
                  />
                  <Button
                    onClick={searchExercises}
                    disabled={searching}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    {searching ? '...' : <Search size={16} />}
                  </Button>
                </div>

                {/* Resultados */}
                {searchResults.length > 0 && !selectedExercise && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {searchResults.map(ex => (
                      <div
                        key={ex.exerciseId}
                        onClick={() => setSelectedExercise(ex)}
                        className="bg-zinc-800 rounded-lg p-2 cursor-pointer hover:border hover:border-orange-500 transition flex flex-col items-center gap-2"
                      >
                        <img
                          src={ex.imageUrl}
                          alt={ex.name}
                          className="w-full h-20 object-cover rounded"
                        />
                        <p className="text-white text-xs text-center capitalize leading-tight">{ex.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && search && !searching && (
                  <p className="text-zinc-500 text-xs text-center">Sin resultados para &quot;{search}&quot;</p>
                )}

                {/* Configurar ejercicio seleccionado */}
                {selectedExercise && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3">
                      <img
                        src={selectedExercise.imageUrl}
                        alt={selectedExercise.name}
                        className="w-16 h-16 rounded object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium capitalize truncate">{selectedExercise.name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedExercise(null)}
                        className="text-zinc-500 shrink-0"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-zinc-400 text-xs">Series</Label>
                        <Input
                          type="number"
                          value={exForm.sets}
                          onChange={e => setExForm({ ...exForm, sets: parseInt(e.target.value) })}
                          className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Reps</Label>
                        <Input
                          value={exForm.reps}
                          onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                          placeholder="10"
                          className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Descanso</Label>
                        <Input
                          value={exForm.rest}
                          onChange={e => setExForm({ ...exForm, rest: e.target.value })}
                          placeholder="60s"
                          className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Notas (opcional)</Label>
                      <Input
                        value={exForm.notes}
                        onChange={e => setExForm({ ...exForm, notes: e.target.value })}
                        placeholder="Ej: Foco en la bajada lenta"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <Button
                      onClick={addExerciseToDay}
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Agregar al día
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Agregar día */}
      {days.length < 7 && (
        <Button
          variant="outline"
          onClick={addDay}
          className="border-dashed border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-400 w-full mb-6"
        >
          <Plus size={16} className="mr-2" />
          Agregar día
        </Button>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
          {saving ? 'Guardando...' : 'Guardar rutina'}
        </Button>
      </div>
    </div>
  )
}
