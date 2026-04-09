import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, Flame, Zap, Moon, Activity, Plus, Scale, ArrowDown, ArrowUp, Salad, Pencil, Target, BellRing, NotebookPen
} from 'lucide-react'
import ClientHeader from './components/ClientHeader'
import TodayWorkout from './components/TodayWorkout'
import TodayMeal from './components/TodayMeal'
import CheckinReminder from './components/CheckinReminder'
import CheckinHistory from '@/components/checkins/CheckinHistory'
import Link from 'next/link'
import SubscriptionStatusCard from '@/components/subscriptions/subscription-status-card'
import { summarizeClientSubscription } from '@/lib/client-subscriptions'

type RoutineContent = {
  notes?: string | null
}

type NutritionContent = {
  notes?: string | null
}

type RoutineDay = {
  day?: string | null
  focus?: string | null
  is_rest?: boolean
  exercises?: unknown[]
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function normalizeSpanishDay(value?: string | null) {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getRoutineDayOrder(day?: string | null) {
  const normalized = normalizeSpanishDay(day)
  const order = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
  return order.findIndex((label) => normalized.includes(label))
}

function getSessionDayOrder(date: string) {
  const jsDay = new Date(`${date}T00:00:00`).getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function startOfWeek() {
  const date = startOfToday()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

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
    .from('profiles').select('*')
    .eq('id', clientData.trainer_id).single()

  const { data: subscription } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('client_id', clientData.id)
    .maybeSingle()

  const subscriptionSummary = summarizeClientSubscription(subscription)

  if (!subscriptionSummary.isActive) {
    return (
      <div className="flex flex-col gap-6 pb-28">
        <ClientHeader
          firstName={clientData.full_name.split(' ')[0]}
          greeting={new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'}
          goal={clientData.goal}
          level={clientData.level}
          trainerName={trainerProfile?.full_name?.split(' ')[0]}
          trainerAvatar={trainerProfile?.avatar_url}
        />
        <SubscriptionStatusCard
          summary={subscriptionSummary}
          title="Tu acceso esta pausado"
          body="Tu entrenador necesita activar o renovar tu suscripcion para volver a mostrar rutinas, nutricion y check-ins."
          ctaHref="/client/profile"
          ctaLabel="Ver mi perfil"
        />
      </div>
    )
  }

  const [routineRes, planRes, { data: checkins }, { data: sessions }] = await Promise.all([
    supabase.from('routines').select('*').eq('client_id', clientData.id).eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('nutrition_plans').select('*').eq('client_id', clientData.id).eq('is_active', true).limit(1).maybeSingle(),
    supabase.from('checkins').select('*').eq('client_id', clientData.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('workout_sessions').select('id, date').eq('client_id', clientData.id).order('date', { ascending: false }).limit(10),
  ])

  const routine = routineRes?.data
  const plan = planRes?.data
  const canCheckIn = Boolean(routine || plan)
  const lastCheckin = checkins?.[0]
  const firstName = clientData.full_name.split(' ')[0]
  const routineContent = routine?.content as (RoutineContent & { days?: RoutineDay[] }) | null
  const routineNotes = (routineContent?.notes ?? '').trim()
  const nutritionNotes = ((plan?.content as NutritionContent | null)?.notes ?? '').trim()

  const weightCheckins = checkins?.filter(c => c.weight) ?? []
  const weightChange = weightCheckins.length >= 2
    ? +(weightCheckins[0].weight - weightCheckins[weightCheckins.length - 1].weight).toFixed(1)
    : null

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const todayStart = startOfToday()
  const weekStart = startOfWeek()
  const hasDailyCheckinToday = (checkins ?? []).some(checkin =>
    checkin.type === 'daily' && new Date(checkin.created_at) >= todayStart
  )
  const weeklyCheckinThisWeek = (checkins ?? []).find(checkin =>
    checkin.type === 'weekly' && new Date(checkin.created_at) >= weekStart
  )
  const hasWeeklyCheckinThisWeek = Boolean(weeklyCheckinThisWeek)
  const weeklyWeightMissing = hasWeeklyCheckinThisWeek && !weeklyCheckinThisWeek?.weight
  const hasWorkoutToday = (sessions ?? []).some(session => {
    const sessionDate = new Date(`${session.date}T00:00:00`)
    return sessionDate >= todayStart
  })
  const sessionsThisWeek = (sessions ?? []).filter(session => {
    const sessionDate = new Date(`${session.date}T00:00:00`)
    return sessionDate >= weekStart
  }).length
  const lastAssignedTrainingDayOrder = (() => {
    const activeDays = (routineContent?.days ?? []).filter((day) => !day.is_rest && (day.exercises?.length ?? 0) > 0)
    const orders = activeDays
      .map((day) => getRoutineDayOrder(day.day))
      .filter((value): value is number => value >= 0)

    if (orders.length === 0) return null
    return Math.max(...orders)
  })()
  const lastAssignedTrainingCompletedThisWeek = lastAssignedTrainingDayOrder !== null && (sessions ?? []).some((session) => {
    const sessionDate = new Date(`${session.date}T00:00:00`)
    return sessionDate >= weekStart && getSessionDayOrder(session.date) === lastAssignedTrainingDayOrder
  })
  const coachNotes = [
    routineNotes ? { title: 'Rutina activa', body: routineNotes } : null,
    nutritionNotes ? { title: 'Plan nutricional', body: nutritionNotes } : null,
  ].filter(Boolean) as { title: string; body: string }[]
  const currentCheckinEditHref = hasDailyCheckinToday
    ? '/client/checkin?type=daily'
    : hasWeeklyCheckinThisWeek
      ? '/client/checkin?type=weekly'
      : null
  const todayDayOrder = getSessionDayOrder(now.toISOString().split('T')[0])
  const nextWorkoutReference = (() => {
    const activeDays = (routineContent?.days ?? [])
      .filter((day) => !day.is_rest && (day.exercises?.length ?? 0) > 0)
      .map((day) => ({ ...day, order: getRoutineDayOrder(day.day) }))
      .filter((day): day is RoutineDay & { order: number } => day.order >= 0)
      .sort((a, b) => a.order - b.order)

    if (activeDays.length === 0) return null

    const todayWorkout = activeDays.find((day) => day.order === todayDayOrder)
    if (todayWorkout && !hasWorkoutToday) {
      return {
        ...todayWorkout,
        timingLabel: 'Hoy',
      }
    }

    const upcoming = activeDays.find((day) => day.order > todayDayOrder) ?? activeDays[0]
    return {
      ...upcoming,
      timingLabel: upcoming.order > todayDayOrder ? 'Próximo turno' : 'Próxima semana',
    }
  })()

  return (
    <>
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
          trainerName={trainerProfile?.full_name?.split(' ')[0]}
          trainerAvatar={trainerProfile?.avatar_url}
        />

        {canCheckIn ? (
          <CheckinReminder clientId={clientData.id} />
        ) : (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60">
                <ClipboardList size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Check-in aún no disponible</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                  Se activará cuando tengas una rutina o un plan nutricional activo.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <TodayWorkout
          routine={routine}
          routineId={routine?.id ?? ''}
          clientId={clientData.id}
        />

        {plan ? (
          <TodayMeal plan={plan} planId={plan.id} />
        ) : (
          <Link href="/client/nutrition">
            <Card className="cursor-pointer border-dashed border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Salad size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin plan activo</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Selecciona un plan nutricional</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {canCheckIn && ((lastAssignedTrainingCompletedThisWeek && !hasWeeklyCheckinThisWeek) || weeklyWeightMissing) ? (
          <Card className="border-amber-500/20 bg-amber-500/10">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                <BellRing size={18} className="text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-100">
                  {weeklyWeightMissing ? 'Te falta registrar tu peso semanal' : 'Aún no envías tu check-in semanal'}
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-100/80">
                  {weeklyWeightMissing
                    ? 'Tu check-in de esta semana ya existe, pero sin peso. Complétalo para que tu progreso corporal se vea actualizado.'
                    : 'Ya completaste tu último entrenamiento asignado de la semana. Ahora envía tu check-in para cerrar el seguimiento con tu entrenador.'}
                </p>
                <div className="mt-3">
                  <Link href="/client/checkin?type=weekly">
                    <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-400">
                      {weeklyWeightMissing ? 'Completar check-in semanal' : 'Enviar check-in semanal'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Target size={15} className="text-primary" />
                  Próximo entrenamiento
                </p>
                {nextWorkoutReference ? (
                  <>
                    <p className="mt-3 text-base font-semibold text-foreground">{nextWorkoutReference.day}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {nextWorkoutReference.focus?.trim() || 'Sesión programada por tu entrenador'}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {Array.isArray(nextWorkoutReference.exercises) ? nextWorkoutReference.exercises.length : 0} ejercicios
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-base font-semibold text-foreground">Sin entrenamiento programado</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Cuando tu entrenador active una rutina con días asignados, aquí verás tu próxima sesión.
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {nextWorkoutReference ? (
                  <Badge className="shrink-0 border-primary/20 bg-primary/10 text-primary">
                    {nextWorkoutReference.timingLabel}
                  </Badge>
                ) : null}
                <Badge className="shrink-0 border-border bg-background text-foreground">
                  {sessionsThisWeek} / semana
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {coachNotes.length > 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <NotebookPen size={15} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Notas de tu entrenador</p>
              </div>
              <div className="mt-4 space-y-3">
                {coachNotes.map((note) => (
                  <div key={note.title} className="rounded-2xl border border-border bg-muted/25 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{note.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity size={15} className="text-primary" />
              Mis check-ins
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasDailyCheckinToday ? (
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  Check-in diario enviado
                </Badge>
              ) : null}
              {hasWeeklyCheckinThisWeek ? (
                <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-300">
                  Check-in semanal enviado
                </Badge>
              ) : null}
              {currentCheckinEditHref ? (
                <Link href={currentCheckinEditHref}>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 border-border text-foreground">
                    <Pencil size={12} />
                    Editar último
                  </Button>
                </Link>
              ) : null}
              {canCheckIn ? (
                <Link href="/client/checkin">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5">
                    <Plus size={12} />
                    Nuevo
                  </Button>
                </Link>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Requiere plan o rutina activa
                </Badge>
              )}
            </div>
          </div>
          <CheckinHistory checkins={checkins ?? []} />
        </div>

      </div>
    </>
  )
}
