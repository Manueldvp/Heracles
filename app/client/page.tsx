import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, Flame, Zap, Moon, Activity, Plus, Scale, ArrowDown, ArrowUp, Dumbbell
} from 'lucide-react'
import ClientHeader from './components/ClientHeader'
import TodayWorkout from './components/TodayWorkout'
import TodayMeal from './components/TodayMeal'
import { HerculesStyles } from './components/HerculesMascot'
import CheckinReminder from './components/CheckinReminder'
import Link from 'next/link'

export default async function ClientHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientData } = await supabase
    .from('clients').select('*').eq('user_id', user.id).single()

  if (!clientData) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-3">
        <Flame size={40} className="text-zinc-600" />
        <p className="text-zinc-400">Tu perfil aún no está configurado.</p>
        <p className="text-zinc-500 text-sm">Contacta a tu entrenador.</p>
      </div>
    )
  }

  const { data: trainerProfile } = await supabase
    .from('profiles').select('ai_trainer_name, full_name, avatar_url')
    .eq('id', clientData.trainer_id).single()

  const [routineRes, planRes, { data: checkins }] = await Promise.all([
    supabase.from('routines').select('*').eq('client_id', clientData.id).eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('nutrition_plans').select('*').eq('client_id', clientData.id).eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('checkins').select('*').eq('client_id', clientData.id).order('created_at', { ascending: false }).limit(5),
  ])

  const routine = routineRes?.data
  const plan = planRes?.data
  const lastCheckin = checkins?.[0]
  const firstName = clientData.full_name.split(' ')[0]

  const weightCheckins = checkins?.filter(c => c.weight) ?? []
  const weightChange = weightCheckins.length >= 2
    ? +(weightCheckins[0].weight - weightCheckins[weightCheckins.length - 1].weight).toFixed(1)
    : null

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <HerculesStyles />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col gap-6 pb-28">

        {/* Header */}
        <ClientHeader
          firstName={firstName}
          greeting={greeting}
          goal={clientData.goal}
          level={clientData.level}
          clientName={clientData.full_name}
          assistantName={trainerProfile?.ai_trainer_name || 'Heracles'}
          trainerName={trainerProfile?.full_name?.split(' ')[0]}
          trainerAvatar={trainerProfile?.avatar_url}
        />
        <CheckinReminder clientId={clientData.id} />
        {/* ── Entrenamiento de hoy ── */}
        <TodayWorkout
          routine={routine}
          routineId={routine?.id ?? ''}
          clientId={clientData.id}  // ← agregar esto
        />

        {/* ── Comida actual / próxima ── */}
        {plan ? (
          <TodayMeal plan={plan} planId={plan.id} />
        ) : (
          <Link href="/client/nutrition">
            <Card className="bg-zinc-900/50 border-dashed border-zinc-800 hover:border-zinc-600 transition cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <Flame size={18} className="text-zinc-600" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-medium">Sin plan activo</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Selecciona un plan nutricional</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Peso actual</p>
                  <p className="text-white font-bold text-2xl leading-none">
                    {clientData.weight}
                    <span className="text-zinc-500 text-sm font-normal ml-1">kg</span>
                  </p>
                  {weightChange !== null && (
                    <div className={`flex items-center gap-1 mt-2 ${weightChange <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {weightChange <= 0 ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                      <span className="text-xs">{Math.abs(weightChange)}kg total</span>
                    </div>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Scale size={16} className="text-zinc-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Check-ins</p>
                  <p className="text-purple-400 font-bold text-2xl leading-none">{checkins?.length ?? 0}</p>
                  <p className="text-zinc-600 text-xs mt-2">registrados</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ClipboardList size={16} className="text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Energía</p>
                  <p className="text-orange-400 font-bold text-2xl leading-none">
                    {lastCheckin ? lastCheckin.energy_level : '—'}
                    <span className="text-zinc-600 text-sm font-normal">/5</span>
                  </p>
                  <p className="text-zinc-600 text-xs mt-2">último check-in</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Zap size={16} className="text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Sueño</p>
                  <p className="text-blue-400 font-bold text-2xl leading-none">
                    {lastCheckin ? lastCheckin.sleep_quality : '—'}
                    <span className="text-zinc-600 text-sm font-normal">/5</span>
                  </p>
                  <p className="text-zinc-600 text-xs mt-2">último check-in</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Moon size={16} className="text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Check-ins ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <Activity size={15} className="text-purple-400" />
                Mis check-ins
              </p>
              <Link href="/client/checkin">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7 gap-1">
                  <Plus size={12} />
                  Nuevo
                </Button>
              </Link>
            </div>

            {lastCheckin ? (
              <div className="flex flex-col gap-3">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-zinc-400 text-xs font-medium">Último check-in</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      {new Date(lastCheckin.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { icon: Zap,      label: 'Energía',  value: `${lastCheckin.energy_level}/5`,                      color: 'text-orange-400', bg: 'bg-orange-500/10' },
                      { icon: Moon,     label: 'Sueño',    value: `${lastCheckin.sleep_quality}/5`,                     color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
                      { icon: Dumbbell, label: 'Entrenos', value: lastCheckin.completed_workouts,                        color: 'text-green-400',  bg: 'bg-green-500/10'  },
                      { icon: Scale,    label: 'Peso',     value: lastCheckin.weight ? `${lastCheckin.weight}kg` : '—', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    ].map(({ icon: Icon, label, value, color, bg }, i) => (
                      <div key={i} className={`${bg} rounded-xl py-2.5`}>
                        <Icon size={12} className={`${color} mx-auto mb-1`} />
                        <p className="text-zinc-500 text-xs">{label}</p>
                        <p className={`${color} font-bold text-sm`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {lastCheckin.notes && (
                    <p className="text-zinc-600 text-xs mt-3 border-t border-zinc-700 pt-3 italic truncate">
                      "{lastCheckin.notes}"
                    </p>
                  )}
                </div>

                {checkins && checkins.length > 1 && (
                  <div className="flex gap-2">
                    {checkins.slice(1, 5).map((c, i) => (
                      <div key={i} className="flex-1 bg-zinc-800/60 rounded-xl p-2.5 text-center">
                        <p className="text-zinc-600 text-xs">
                          {new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-zinc-400 text-xs mt-1 flex items-center justify-center gap-0.5">
                          <Zap size={9} className="text-orange-400" />{c.energy_level}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList size={28} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Aún no has hecho check-ins</p>
                <Link href="/client/checkin">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs mt-3">
                    Hacer mi primer check-in
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  )
}
