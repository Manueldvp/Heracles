import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, Dumbbell, ClipboardList,
  TrendingUp, AlertTriangle, ChevronRight,
  Activity, Zap, Moon, Calendar
} from 'lucide-react'
import Link from 'next/link'
import DashboardInviteButton from './components/DashboardInviteButton'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ai_trainer_name')
    .eq('id', user!.id)
    .single()

  // Solo clientes activos (status != pending)
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('trainer_id', user!.id)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  const clientIds = clients?.map(c => c.id) ?? []

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)

  const { data: allCheckins } = await supabase
    .from('checkins')
    .select('*')
    .in('client_id', clientIds.length > 0 ? clientIds : ['none'])
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false })

  const { data: recentRoutines } = await supabase
    .from('routines')
    .select('*, clients(full_name)')
    .in('client_id', clientIds.length > 0 ? clientIds : ['none'])
    .order('created_at', { ascending: false })
    .limit(4)

  const checkinsToday = allCheckins?.filter(c => new Date(c.created_at) >= todayStart) ?? []
  const activeClientIds = new Set(allCheckins?.map(c => c.client_id) ?? [])
  const inactiveClients = clients?.filter(c => !activeClientIds.has(c.id)) ?? []
  const painAlerts = allCheckins?.filter(c => c.pain_zones && c.pain_zones.length > 0) ?? []

  const { data: clientsWithRoutine } = await supabase
    .from('routines')
    .select('client_id')
    .in('client_id', clientIds.length > 0 ? clientIds : ['none'])
    .eq('is_active', true)

  const clientsWithRoutineIds = new Set(clientsWithRoutine?.map(r => r.client_id) ?? [])
  const clientsWithoutRoutine = clients?.filter(c => !clientsWithRoutineIds.has(c.id)) ?? []

  const routinesThisWeek = recentRoutines?.filter(r => new Date(r.created_at) > weekAgo).length ?? 0
  const checkinsThisWeek = allCheckins?.length ?? 0

  const trainerName = profile?.full_name?.split(' ')[0] ?? 'Entrenador'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-zinc-500 text-sm">{greeting}</p>
          <h2 className="font-display text-4xl text-white tracking-wide mt-0.5">{trainerName}</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <DashboardInviteButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Clientes activos',   value: clients?.length ?? 0,  icon: Users,        color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Check-ins hoy',      value: checkinsToday.length,   icon: Activity,     color: 'text-green-400',  bg: 'bg-green-500/10'  },
          { label: 'Rutinas esta semana',value: routinesThisWeek,        icon: Dumbbell,     color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
          { label: 'Check-ins semana',   value: checkinsThisWeek,        icon: ClipboardList,color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon size={17} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {(painAlerts.length > 0 || inactiveClients.length > 0 || clientsWithoutRoutine.length > 0) && (
        <div className="mb-6 flex flex-col gap-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <AlertTriangle size={15} className="text-yellow-400" />
            Requieren atención
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {painAlerts.length > 0 && (
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle size={13} className="text-red-400" />
                    </div>
                    <p className="text-red-400 font-semibold text-sm">Dolor reportado</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {painAlerts.slice(0, 3).map((c, i) => {
                      const client = clients?.find(cl => cl.id === c.client_id)
                      return (
                        <Link key={i} href={`/dashboard/clients/${c.client_id}`}>
                          <div className="flex items-center justify-between hover:bg-red-500/10 rounded-lg px-2 py-1 transition">
                            <p className="text-zinc-300 text-xs">{client?.full_name}</p>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {c.pain_zones?.slice(0, 2).map((z: string) => (
                                <Badge key={z} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0">{z}</Badge>
                              ))}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {inactiveClients.length > 0 && (
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Calendar size={13} className="text-yellow-400" />
                    </div>
                    <p className="text-yellow-400 font-semibold text-sm">Sin actividad</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {inactiveClients.slice(0, 3).map((c) => (
                      <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
                        <div className="flex items-center justify-between hover:bg-yellow-500/10 rounded-lg px-2 py-1 transition">
                          <p className="text-zinc-300 text-xs">{c.full_name}</p>
                          <p className="text-zinc-600 text-xs">+7 días</p>
                        </div>
                      </Link>
                    ))}
                    {inactiveClients.length > 3 && (
                      <p className="text-zinc-600 text-xs px-2">+{inactiveClients.length - 3} más</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {clientsWithoutRoutine.length > 0 && (
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Dumbbell size={13} className="text-blue-400" />
                    </div>
                    <p className="text-blue-400 font-semibold text-sm">Sin rutina activa</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {clientsWithoutRoutine.slice(0, 3).map((c) => (
                      <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
                        <div className="flex items-center justify-between hover:bg-blue-500/10 rounded-lg px-2 py-1 transition">
                          <p className="text-zinc-300 text-xs">{c.full_name}</p>
                          <p className="text-blue-400 text-xs">Asignar →</p>
                        </div>
                      </Link>
                    ))}
                    {clientsWithoutRoutine.length > 3 && (
                      <p className="text-zinc-600 text-xs px-2">+{clientsWithoutRoutine.length - 3} más</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Clientes */}
        <div className="lg:col-span-3">
          <Card className="bg-zinc-900 border-zinc-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Users size={15} className="text-orange-400" /> Clientes activos
              </CardTitle>
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-orange-400 text-xs h-7 px-2">
                  Ver todos <ChevronRight size={13} className="ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {!clients || clients.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Aún no tienes clientes</p>
                  <p className="text-zinc-600 text-xs mt-1">Usa el botón "Invitar cliente" para agregar uno</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {clients.slice(0, 6).map((client) => {
                    const lastCheckin = allCheckins?.find(c => c.client_id === client.id)
                    const checkedToday = checkinsToday.some(c => c.client_id === client.id)
                    const hasRoutine = clientsWithRoutineIds.has(client.id)
                    return (
                      <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition group">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center overflow-hidden">
                              {client.avatar_url
                                ? <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                                : <span className="text-orange-400 font-bold text-sm">{client.full_name.charAt(0).toUpperCase()}</span>
                              }
                            </div>
                            {checkedToday && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-zinc-900" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm font-medium truncate group-hover:text-orange-400 transition">
                                {client.full_name}
                              </p>
                              {!hasRoutine && (
                                <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-xs px-1.5 py-0 shrink-0">Sin rutina</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <Badge className={`text-xs px-1.5 py-0 border ${goalColor[client.goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                {goalLabel[client.goal] ?? client.goal}
                              </Badge>
                              {lastCheckin && (
                                <span className="text-zinc-600 text-xs flex items-center gap-1">
                                  <Activity size={10} />
                                  {new Date(lastCheckin.created_at).toLocaleDateString('es-CL')}
                                </span>
                              )}
                            </div>
                          </div>
                          {lastCheckin && (
                            <div className="flex gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <Zap size={11} className="text-orange-400" />
                                <span className="text-zinc-400 text-xs">{lastCheckin.energy_level}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Moon size={11} className="text-blue-400" />
                                <span className="text-zinc-400 text-xs">{lastCheckin.sleep_quality}</span>
                              </div>
                            </div>
                          )}
                          <ChevronRight size={14} className="text-zinc-700 group-hover:text-orange-400 transition shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <TrendingUp size={15} className="text-purple-400" /> Check-ins recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {!allCheckins || allCheckins.length === 0 ? (
                <p className="text-zinc-600 text-sm px-2 py-3">Sin check-ins esta semana</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {allCheckins.slice(0, 4).map((checkin) => {
                    const client = clients?.find(c => c.id === checkin.client_id)
                    const isToday = new Date(checkin.created_at) >= todayStart
                    return (
                      <Link key={checkin.id} href={`/dashboard/clients/${checkin.client_id}`}>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800 transition group">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <span className="text-purple-400 font-bold text-xs">{client?.full_name?.charAt(0) ?? '?'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{client?.full_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-zinc-500 text-xs flex items-center gap-1"><Zap size={9} className="text-orange-400" />{checkin.energy_level}/5</span>
                              <span className="text-zinc-500 text-xs flex items-center gap-1"><Moon size={9} className="text-blue-400" />{checkin.sleep_quality}/5</span>
                              <span className="text-zinc-500 text-xs flex items-center gap-1"><Dumbbell size={9} className="text-green-400" />{checkin.completed_workouts}</span>
                            </div>
                          </div>
                          {isToday
                            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 shrink-0">Hoy</Badge>
                            : <span className="text-zinc-600 text-xs shrink-0">{new Date(checkin.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                          }
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Dumbbell size={15} className="text-blue-400" /> Rutinas recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {!recentRoutines || recentRoutines.length === 0 ? (
                <p className="text-zinc-600 text-sm px-2 py-3">Sin rutinas generadas</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentRoutines.slice(0, 4).map((routine) => (
                    <Link key={routine.id} href={`/dashboard/clients/${routine.client_id}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800 transition group">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Dumbbell size={13} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{(routine.content as any)?.title ?? routine.title}</p>
                          <p className="text-zinc-500 text-xs truncate">{(routine.clients as any)?.full_name}</p>
                        </div>
                        <span className="text-zinc-600 text-xs shrink-0">
                          {new Date(routine.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
