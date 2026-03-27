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

  // 1. Redirect automático al onboarding si no ha completado el formulario
  if (clientData && !clientData.onboarding_completed && clientData.invite_token) {
    redirect(`/onboarding/${clientData.invite_token}`)
  }

  // 2. Sin perfil configurado
  if (!clientData) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Flame size={40} className="text-muted-foreground" />
        <p className="text-foreground">Tu perfil aún no está configurado.</p>
        <p className="text-sm text-muted-foreground">Contacta a tu entrenador.</p>
      </div>
    )
  }

  // 3. Onboarding pendiente pero sin token (caso edge — cerró el browser a mitad)
  if (!clientData.onboarding_completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <ClipboardList size={28} className="text-primary" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Completa tu perfil</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Antes de acceder a tu dashboard necesitas completar el cuestionario inicial para que tu entrenador pueda personalizar tu programa.
          </p>
        </div>
        {clientData.invite_token && (
          <Link href={`/onboarding/${clientData.invite_token}`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-11 px-6">
              <ClipboardList size={16} />
              Completar cuestionario
            </Button>
          </Link>
        )}
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

        <ClientHeader
          firstName={firstName}
          greeting={greeting}
          goal={clientData.goal}
          level={clientData.level}
          clientName={clientData.full_name}
          assistantName={trainerProfile?.ai_trainer_name || 'Treinex'}
          trainerName={trainerProfile?.full_name?.split(' ')[0]}
          trainerAvatar={trainerProfile?.avatar_url}
        />

        <CheckinReminder clientId={clientData.id} />

        <TodayWorkout
          routine={routine}
          routineId={routine?.id ?? ''}
          clientId={clientData.id}
        />

        {plan ? (
          <TodayMeal plan={plan} planId={plan.id} />
        ) : (
          <Link href="/client/nutrition">
            <Card className="cursor-pointer border-dashed border-border bg-card transition hover:border-border/80">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-transparent">
                  <Flame size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin plan activo</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Selecciona un plan nutricional</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Peso actual</p>
                  <p className="text-2xl font-bold leading-none text-foreground">
                    {clientData.weight ?? '—'}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
                  </p>
                  {weightChange !== null && (
                    <div className={`flex items-center gap-1 mt-2 ${weightChange <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {weightChange <= 0 ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                      <span className="text-xs">{Math.abs(weightChange)}kg total</span>
                    </div>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-transparent">
                  <Scale size={16} className="text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Check-ins</p>
                  <p className="text-2xl font-bold leading-none text-foreground">{checkins?.length ?? 0}</p>
                  <p className="mt-2 text-xs text-muted-foreground">registrados</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <ClipboardList size={16} className="text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Energía</p>
                  <p className="text-2xl font-bold leading-none text-foreground">
                    {lastCheckin ? lastCheckin.energy_level : '—'}
                    <span className="text-sm font-normal text-muted-foreground">/5</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">último check-in</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Zap size={16} className="text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Sueño</p>
                  <p className="text-2xl font-bold leading-none text-foreground">
                    {lastCheckin ? lastCheckin.sleep_quality : '—'}
                    <span className="text-sm font-normal text-muted-foreground">/5</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">último check-in</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-transparent">
                  <Moon size={16} className="text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity size={15} className="text-primary" />
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
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Último check-in</p>
                    <Badge className="text-xs">
                      {new Date(lastCheckin.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { icon: Zap,      label: 'Energía',  value: `${lastCheckin.energy_level}/5`,                       color: 'text-primary',          bg: 'border border-primary/20 bg-primary/10' },
                      { icon: Moon,     label: 'Sueño',    value: `${lastCheckin.sleep_quality}/5`,                      color: 'text-muted-foreground', bg: 'border border-border bg-background' },
                      { icon: Dumbbell, label: 'Entrenos', value: lastCheckin.completed_workouts,                         color: 'text-green-400',        bg: 'border border-green-500/20 bg-green-500/10' },
                      { icon: Scale,    label: 'Peso',     value: lastCheckin.weight ? `${lastCheckin.weight}kg` : '—',  color: 'text-foreground',       bg: 'border border-border bg-background' },
                    ].map(({ icon: Icon, label, value, color, bg }, i) => (
                      <div key={i} className={`${bg} rounded-xl py-2.5`}>
                        <Icon size={12} className={`${color} mx-auto mb-1`} />
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`${color} font-bold text-sm`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {lastCheckin.notes && (
                    <p className="mt-3 truncate border-t border-border pt-3 text-xs italic text-muted-foreground">
                      &quot;{lastCheckin.notes}&quot;
                    </p>
                  )}
                </div>

                {checkins && checkins.length > 1 && (
                  <div className="flex gap-2">
                    {checkins.slice(1, 5).map((c, i) => (
                      <div key={i} className="flex-1 rounded-xl border border-border bg-muted/30 p-2.5 text-center">
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="mt-1 flex items-center justify-center gap-0.5 text-xs text-foreground">
                          <Zap size={9} className="text-primary" />{c.energy_level}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList size={28} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aún no has hecho check-ins</p>
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
