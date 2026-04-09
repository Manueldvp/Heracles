import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SaveAsTemplateButton from './components/SaveAsTemplateButton'
import Link from 'next/link'
import ExerciseDetails from '@/components/routines/ExerciseDetails'

type RoutineExercise = {
  name: string
  description?: string | null
  instructions?: string[] | string | null
  sets: number
  reps: string
  rest: string
  notes?: string | null
  image_url?: string | null
}

type RoutineDay = {
  day: string
  focus?: string | null
  is_rest?: boolean
  rest_notes?: string | null
  exercises?: RoutineExercise[]
}

type RoutineContent = {
  title?: string
  notes?: string | null
  days?: RoutineDay[]
}

export default async function RoutinePage({
  params,
}: {
  params: Promise<{ id: string; routineId: string }>
}) {
  const { id, routineId } = await params
  const supabase = await createClient()

  const { data: routine } = await supabase
    .from('routines')
    .select('*')
    .eq('id', routineId)
    .single()

  if (!routine) notFound()

  const content = routine.content as RoutineContent

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">{content.title}</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date(routine.created_at).toLocaleDateString('es-CL', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SaveAsTemplateButton
            routineTitle={content.title ?? 'Rutina'}
            routineContent={content}
          />
          <Link href={`/dashboard/clients/${id}/routines/${routineId}/edit`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              ✏️ Editar rutina
            </Button>
          </Link>
          <Link href={`/dashboard/clients/${id}`}>
            <Button variant="outline" className="border-zinc-700 text-zinc-400">
              ← Volver al cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Días de entrenamiento */}
      <div className="grid gap-4 mb-6">
        {content.days?.map((day, index: number) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {day.day}
                </Badge>
                {day.focus && (
                  <CardTitle className="text-white text-base">{day.focus}</CardTitle>
                )}
                {day.is_rest ? (
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-300">
                    Descanso
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {day.is_rest ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm font-medium text-emerald-300">Día de descanso</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {day.rest_notes?.trim() || 'Jornada sin ejercicios programados.'}
                  </p>
                </div>
              ) : (
              <div className="grid gap-3">
                {day.exercises?.map((exercise, i: number) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {exercise.image_url && (
                          <img
                            src={exercise.image_url}
                            alt={exercise.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <p className="text-white font-medium capitalize">{exercise.name}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                          {exercise.sets} series
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                          {exercise.reps} reps
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                          {exercise.rest} descanso
                        </Badge>
                      </div>
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notas generales */}
      {content.notes && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">📋 Recomendaciones generales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm leading-relaxed">{content.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
