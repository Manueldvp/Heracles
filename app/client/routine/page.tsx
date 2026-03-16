import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import SetActiveRoutineButton from './SetActiveRoutineButton'

export default async function ClientRoutineListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients').select('*').eq('user_id', user.id).single()
  if (!client) redirect('/client')

  const { data: routines } = await supabase
    .from('routines').select('*').eq('client_id', client.id).order('created_at', { ascending: false })

  const activeRoutine = routines?.find(r => r.is_active)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client" className="text-zinc-500 hover:text-zinc-300 transition">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Mis rutinas</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{routines?.length ?? 0} rutinas asignadas · toca una para activarla</p>
        </div>
      </div>

      {!routines || routines.length === 0 ? (
        <Card className="bg-zinc-900 border-dashed border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Dumbbell size={36} className="text-zinc-600" />
            <p className="text-zinc-400 text-sm">Tu entrenador aún no ha asignado rutinas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((routine) => {
            const content = routine.content as any
            const dayCount = content.days?.length ?? 0
            const isActive = routine.is_active

            return (
              <Card key={routine.id}
                className={`bg-zinc-900 transition ${isActive ? 'border-orange-500/40' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-orange-500/20' : 'bg-blue-500/10'}`}>
                      <Dumbbell size={16} className={isActive ? 'text-orange-400' : 'text-blue-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm truncate">{content.title ?? routine.title}</p>
                        {isActive && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs shrink-0">Activa</Badge>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {dayCount} días · {new Date(routine.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <Link href={`/client/routine/${routine.id}`}>
                      <ChevronRight size={16} className="text-zinc-600 hover:text-zinc-400 transition" />
                    </Link>
                  </div>

                  {/* Preview días */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-3">
                    {content.days?.map((day: any, i: number) => (
                      <div key={i} className="flex-shrink-0 bg-zinc-800 rounded-lg px-2.5 py-1.5 text-center min-w-[64px]">
                        <p className="text-zinc-400 text-xs font-medium">{day.day}</p>
                        {day.focus && <p className="text-zinc-600 text-xs truncate max-w-[56px]">{day.focus}</p>}
                      </div>
                    ))}
                  </div>

                  {!isActive && (
                    <SetActiveRoutineButton routineId={routine.id} clientId={client.id} />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}