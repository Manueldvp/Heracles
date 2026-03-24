import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ExerciseMedia from '@/components/exercise-media'
import { Clock3, Layers3, Sparkles } from 'lucide-react'

type RoutineExercise = {
  name: string
  image_url?: string
  video_url?: string
  media_url?: string
  media_type?: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

type RoutineDay = {
  day: string
  focus?: string
  exercises?: RoutineExercise[]
}

type RoutineContent = {
  title?: string
  notes?: string
  days?: RoutineDay[]
}

export default async function ClientRoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/client')

  const { data: routine } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .eq('client_id', client.id)
    .single()

  if (!routine) notFound()

  const content = routine.content as RoutineContent

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{content.title ?? routine.title}</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date(routine.created_at).toLocaleDateString('es-CL', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <Link href="/client">
          <Button variant="outline" className="border-zinc-700 text-zinc-400">
            ← Volver
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 mb-6">
        {content.days?.map((day, index: number) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {day.day}
                </Badge>
                {day.focus && (
                  <CardTitle className="text-white text-base">{day.focus}</CardTitle>
                )}
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {day.exercises?.length ?? 0} ejercicios
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {day.exercises?.map((exercise, i: number) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                    <div className="grid md:grid-cols-[220px_1fr]">
                      <ExerciseMedia exercise={exercise} compact className="rounded-none border-0" />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div>
                            <p className="text-white font-medium capitalize">{exercise.name}</p>
                            <p className="text-zinc-500 text-xs mt-1">Ejercicio {i + 1}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                              <Layers3 size={12} className="mr-1" />
                              {exercise.sets} series
                            </Badge>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                              <Sparkles size={12} className="mr-1" />
                              {exercise.reps} reps
                            </Badge>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                              <Clock3 size={12} className="mr-1" />
                              {exercise.rest} descanso
                            </Badge>
                          </div>
                        </div>
                        {exercise.notes && (
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                            <p className="text-zinc-400 text-sm leading-6">💡 {exercise.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {content.notes && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">📋 Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm leading-relaxed">{content.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
