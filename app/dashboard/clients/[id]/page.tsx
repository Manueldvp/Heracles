import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ClientExerciseProgress from './components/ClientExerciseProgress'
import ClientNotes from './components/ClientNotes'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, Dumbbell, Salad, ClipboardList, Pencil,
  ChevronRight, Zap, BarChart2, Moon, Activity, Scale, Plus,
  AlertTriangle, CheckCircle2, Clock
} from 'lucide-react'
import Link from 'next/link'
import DeleteClientButton from './components/DeleteClientButton'

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss: 'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  general: 'General',
}

const goalColor: Record<string, string> = {
  muscle_gain: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fat_loss: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  maintenance: 'bg-green-500/20 text-green-400 border-green-500/30',
  strength: 'bg-red-500/20 text-red-400 border-red-500/30',
  endurance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  general: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const levelLabel: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const [
    { data: routines },
    { data: nutritionPlans },
    { data: checkins },
  ] = await Promise.all([
    supabase.from('routines').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('nutrition_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('checkins').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(6),
  ])

  const lastCheckin = checkins?.[0]
  const activeRoutine = routines?.find(r => r.is_active)
  const activeNutrition = nutritionPlans?.find(p => p.is_active)

  const weightCheckins = checkins?.filter(c => c.weight) ?? []
  const weightChange = weightCheckins.length >= 2
    ? +(weightCheckins[0].weight - weightCheckins[weightCheckins.length - 1].weight).toFixed(1)
    : null

  const daysSinceCheckin = lastCheckin
    ? Math.floor((Date.now() - new Date(lastCheckin.created_at).getTime()) / 86400000)
    : null

  const hasPainAlert = lastCheckin?.pain_zones?.length > 0

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center shrink-0 overflow-hidden">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-400 font-bold text-2xl">
                  {client.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {hasPainAlert && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={11} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.full_name}</h2>
            <p className="text-zinc-500 text-sm">{client.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-xs px-2 py-0.5 border ${goalColor[client.goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {goalLabel[client.goal] ?? client.goal}
              </Badge>
              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs px-2 py-0.5">
                {levelLabel[client.level] ?? client.level}
              </Badge>
              {daysSinceCheckin !== null && (
                <Badge className={`text-xs px-2 py-0.5 border ${
                  daysSinceCheckin <= 3 ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : daysSinceCheckin <= 7 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  <Clock size={10} className="inline mr-1" />
                  {daysSinceCheckin === 0 ? 'Check-in hoy' : `Hace ${daysSinceCheckin}d`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/clients/${client.id}/progress`}>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-400">
              <TrendingUp size={14} className="mr-1.5" /> Progreso
            </Button>
          </Link>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
              <Pencil size={14} />
            </Button>
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.full_name} />
        </div>
      </div>

      {/* Alerta dolor */}
      {hasPainAlert && (
        <Card className="bg-red-500/5 border-red-500/20 mb-4">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">
              Reportó dolor en: <span className="font-semibold">{lastCheckin.pain_zones.join(', ')}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Edad',   value: client.age ?? '—',                        unit: 'años',    color: 'text-white'      },
          { label: 'Peso',   value: client.weight ? `${client.weight}kg` : '—', unit: 'actual', color: 'text-orange-400' },
          { label: 'Altura', value: client.height ? `${client.height}cm` : '—', unit: 'estatura',color: 'text-blue-400'  },
          { label: 'Check-ins', value: checkins?.length ?? 0,                  unit: 'total',   color: 'text-purple-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-zinc-600 text-xs mb-2">{stat.label}</p>
              <p className={`${stat.color} font-bold text-2xl`}>{stat.value}</p>
              <p className="text-zinc-700 text-xs mt-0.5">{stat.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progreso de cargas */}
      <div className="mb-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <BarChart2 size={16} className="text-blue-400" /> Progreso de cargas
        </h3>
        <ClientExerciseProgress clientId={client.id} />
      </div>

      {/* Progreso de peso */}
      {weightChange !== null && (
        <Card className={`border mb-4 ${weightChange <= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <TrendingUp size={15} className={weightChange <= 0 ? 'text-green-400' : 'text-orange-400'} />
            <p className="text-zinc-300 text-sm">
              {weightChange <= 0
                ? `Ha bajado ${Math.abs(weightChange)}kg desde el primer registro`
                : `Ha subido ${weightChange}kg desde el primer registro`}
            </p>
            <Badge className={`ml-auto shrink-0 ${weightChange <= 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange}kg
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Restricciones */}
      {client.restrictions && (
        <Card className="bg-yellow-500/5 border-yellow-500/20 mb-4">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-200 text-sm">{client.restrictions}</p>
          </CardContent>
        </Card>
      )}

      {/* Grid rutinas + nutrición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Rutinas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Dumbbell size={14} className="text-blue-400" /> Rutinas
            </CardTitle>
            <Link href={`/dashboard/clients/${client.id}/routines/new`}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1">
                <Plus size={12} /> Nueva
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {!routines || routines.length === 0 ? (
              <div className="text-center py-6">
                <Dumbbell size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Sin rutinas aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {routines.map((routine) => (
                  <Link key={routine.id} href={`/dashboard/clients/${client.id}/routines/${routine.id}`}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition group ${routine.is_active ? 'bg-blue-500/5 border border-blue-500/20' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${routine.is_active ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
                        <Dumbbell size={12} className={routine.is_active ? 'text-blue-400' : 'text-zinc-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate group-hover:text-orange-400 transition">
                          {(routine.content as any)?.title ?? routine.title}
                        </p>
                        <p className="text-zinc-600 text-xs">
                          {new Date(routine.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {routine.is_active && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1.5 shrink-0">Activa</Badge>
                      )}
                      <ChevronRight size={13} className="text-zinc-700 group-hover:text-orange-400 transition shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrición */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Salad size={14} className="text-green-400" /> Planes nutricionales
            </CardTitle>
            <Link href={`/dashboard/clients/${client.id}/nutrition/new`}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1">
                <Plus size={12} /> Nuevo
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {!nutritionPlans || nutritionPlans.length === 0 ? (
              <div className="text-center py-6">
                <Salad size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Sin planes aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {nutritionPlans.map((plan) => {
                  const kcal = (plan.content as any)?.calories_target
                  return (
                    <Link key={plan.id} href={`/dashboard/clients/${client.id}/nutrition/${plan.id}`}>
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition group ${plan.is_active ? 'bg-green-500/5 border border-green-500/20' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${plan.is_active ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                          <Salad size={12} className={plan.is_active ? 'text-green-400' : 'text-zinc-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium group-hover:text-orange-400 transition">
                            {kcal ? `${kcal} kcal/día` : 'Plan nutricional'}
                          </p>
                          <p className="text-zinc-600 text-xs">
                            {new Date(plan.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {plan.is_active && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 shrink-0">Activo</Badge>
                        )}
                        <ChevronRight size={13} className="text-zinc-700 group-hover:text-orange-400 transition shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notas privadas */}
      <div className="mb-4">
        <ClientNotes clientId={client.id} />
      </div>

      {/* Check-ins */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <Activity size={14} className="text-purple-400" /> Check-ins
          </CardTitle>
          <Link href={`/dashboard/clients/${client.id}/checkins/new`}>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1">
              <Plus size={12} /> Nuevo
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {!checkins || checkins.length === 0 ? (
            <div className="text-center py-6">
              <ClipboardList size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">Sin check-ins registrados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">Último check-in</Badge>
                    {lastCheckin?.type && (
                      <Badge className="bg-zinc-700 text-zinc-400 border-zinc-600 text-xs capitalize">{lastCheckin.type}</Badge>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs">
                    {new Date(lastCheckin!.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  {[
                    { icon: Zap,      label: 'Energía',  value: `${lastCheckin?.energy_level}/5`,   color: 'text-orange-400', bg: 'bg-zinc-900/60' },
                    { icon: Moon,     label: 'Sueño',    value: `${lastCheckin?.sleep_quality}/5`,  color: 'text-blue-400',   bg: 'bg-zinc-900/60' },
                    { icon: Dumbbell, label: 'Entrenos', value: lastCheckin?.completed_workouts,    color: 'text-green-400',  bg: 'bg-zinc-900/60' },
                    { icon: Scale,    label: 'Peso',     value: lastCheckin?.weight ? `${lastCheckin.weight}kg` : '—', color: 'text-purple-400', bg: 'bg-zinc-900/60' },
                  ].map(({ icon: Icon, label, value, color, bg }, i) => (
                    <div key={i} className={`${bg} rounded-xl p-2`}>
                      <Icon size={12} className={`${color} mx-auto mb-1`} />
                      <p className="text-zinc-500 text-xs">{label}</p>
                      <p className={`${color} font-bold`}>{value}</p>
                    </div>
                  ))}
                </div>

                {(lastCheckin?.mood || lastCheckin?.water_liters || lastCheckin?.stress_level || lastCheckin?.nutrition_adherence) && (
                  <div className="flex gap-3 flex-wrap mb-3">
                    {lastCheckin.mood && <span className="text-zinc-400 text-xs">Estado: {lastCheckin.mood}/5</span>}
                    {lastCheckin.water_liters && <span className="text-zinc-400 text-xs">Agua: {lastCheckin.water_liters}L</span>}
                    {lastCheckin.stress_level && <span className="text-zinc-400 text-xs">Estrés: {lastCheckin.stress_level}/5</span>}
                    {lastCheckin.nutrition_adherence && <span className="text-zinc-400 text-xs">Adherencia: {lastCheckin.nutrition_adherence}/5</span>}
                  </div>
                )}

                {lastCheckin?.pain_zones?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <div className="flex gap-1 flex-wrap">
                      {lastCheckin.pain_zones.map((z: string) => (
                        <Badge key={z} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5">{z}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lastCheckin?.notes && (
                  <p className="text-zinc-500 text-xs border-t border-zinc-700 pt-2 mt-1">"{lastCheckin.notes}"</p>
                )}

                {lastCheckin?.photo_url && (
                  <div className="mt-3">
                    <img src={lastCheckin.photo_url} alt="Foto check-in" className="w-full max-h-48 object-cover rounded-xl" />
                  </div>
                )}
              </div>

              {checkins.length > 1 && (
                <div className="flex flex-col gap-1 mt-1">
                  {checkins.slice(1).map((checkin) => (
                    <div key={checkin.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800 transition">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={13} className="text-zinc-500" />
                      </div>
                      <p className="text-zinc-500 text-xs flex-1">
                        {new Date(checkin.created_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <div className="flex gap-3 shrink-0">
                        <span className="text-zinc-500 text-xs flex items-center gap-1"><Zap size={9} className="text-orange-400" />{checkin.energy_level}</span>
                        <span className="text-zinc-500 text-xs flex items-center gap-1"><Moon size={9} className="text-blue-400" />{checkin.sleep_quality}</span>
                        <span className="text-zinc-500 text-xs flex items-center gap-1"><Dumbbell size={9} className="text-green-400" />{checkin.completed_workouts}</span>
                      </div>
                      {checkin.pain_zones?.length > 0 && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
