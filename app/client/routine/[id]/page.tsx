import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

  const content = routine.content as any

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
        {content.days?.map((day: any, index: number) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {day.day}
                </Badge>
                {day.focus && (
                  <CardTitle className="text-white text-base">{day.focus}</CardTitle>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {day.exercises?.map((exercise: any, i: number) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      {exercise.image_url && (
                        <img
                          src={exercise.image_url}
                          alt={exercise.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <p className="text-white font-medium capitalize">{exercise.name}</p>
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
                        {exercise.notes && (
                          <p className="text-zinc-400 text-sm">💡 {exercise.notes}</p>
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