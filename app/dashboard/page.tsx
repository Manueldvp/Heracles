import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardInviteButton from './components/DashboardInviteButton'
import MetricCard from './components/MetricCard'
import PortfolioClientCard from './components/PortfolioClientCard'
import DashboardAttentionCards from './components/DashboardAttentionCards'
import QuickActions, { type QuickActionItem } from './components/QuickActions'
import TrainerPerformanceCharts from './components/TrainerPerformanceCharts'
import OnboardingCard from './components/OnboardingCard'
import { getOnboardingProgress, updateOnboardingProgress } from '@/lib/onboarding'
import RecentRoutinesCard from './components/RecentRoutinesCard'
import { summarizeClientSubscription } from '@/lib/client-subscriptions'
import {
  buildWeeklyObjectiveMetrics,
  getWeekRange,
  getWeeklyObjectiveProgress,
  type WeeklyObjective,
} from '@/lib/weekly-objectives'

type RoutineSummary = {
  title?: string
}

type LatestCheckin = {
  client_id: string
  created_at: string
  nutrition_adherence?: number | null
  energy_level?: number | null
  pain_zones?: string[] | null
  type?: string | null
  weight?: number | null
}

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss: 'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  general: 'General',
}

function formatRelativeActivity(date?: string) {
  if (!date) return 'Sin actividad reciente'

  const target = new Date(date)
  const diffDays = Math.floor((Date.now() - target.getTime()) / 86400000)

  if (diffDays <= 0) return 'Última actividad: hoy'
  if (diffDays === 1) return 'Última actividad: hace 1 día'
  return `Última actividad: hace ${diffDays} días`
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ai_trainer_name')
    .eq('id', user!.id)
    .single()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const allClients = clients ?? []
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(now.getDate() - 3)
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const weekRange = getWeekRange(now)

  const nonPendingClients = allClients.filter((client) => client.status !== 'pending')
  const pendingClients = allClients.filter((client) => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const nonPendingIds = nonPendingClients.map((client) => client.id)

  const [
    { data: subscriptions },
    { data: checkins },
    { data: recentRoutines },
    { data: activeRoutines },
    { data: activeNutritionPlans },
    { data: weeklySessions },
    { data: weeklyObjectives },
    { data: todayReminders },
  ] = await Promise.all([
    supabase
      .from('client_subscriptions')
      .select('client_id, status, end_date')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none']),
    supabase
      .from('checkins')
      .select('*')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('routines')
      .select('*, clients(full_name)')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('routines')
      .select('client_id, content')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .eq('is_active', true),
    supabase
      .from('nutrition_plans')
      .select('client_id')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .eq('is_active', true),
    supabase
      .from('workout_sessions')
      .select('client_id, date')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .gte('date', weekRange.startIso.split('T')[0])
      .lt('date', weekRange.end.toISOString().split('T')[0]),
    supabase
      .from('weekly_client_objectives')
      .select('*')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .eq('week_start', weekRange.startIso.split('T')[0]),
    supabase
      .from('notifications')
      .select('client_id, message')
      .eq('trainer_id', user!.id)
      .eq('type', 'reminder')
      .eq('target_role', 'client')
      .gte('created_at', todayStart.toISOString()),
  ])

  const subscriptionMap = new Map(
    (subscriptions ?? []).map((item) => [
      item.client_id,
      summarizeClientSubscription({
        id: item.client_id,
        client_id: item.client_id,
        trainer_id: '',
        start_date: '',
        status: item.status,
        end_date: item.end_date,
      }),
    ]),
  )
  const subscriptionRowsByClient = new Map((subscriptions ?? []).map((item) => [item.client_id, item]))
  const activeClients = nonPendingClients.filter((client) => subscriptionMap.get(client.id)?.isActive)
  const expiredSubscriptions = nonPendingClients.filter((client) => !subscriptionMap.get(client.id)?.isActive)

  const latestCheckinByClient = new Map<string, LatestCheckin>()
  ;(checkins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient.has(checkin.client_id)) {
      latestCheckinByClient.set(checkin.client_id, checkin)
    }
  })

  const clientsWithRoutine = new Set((activeRoutines ?? []).map((routine) => routine.client_id))
  const clientsWithNutrition = new Set((activeNutritionPlans ?? []).map((plan) => plan.client_id))
  const weeklySessionsByClient = new Map<string, Array<{ date: string }>>()
  ;(weeklySessions ?? []).forEach((session) => {
    const current = weeklySessionsByClient.get(session.client_id) ?? []
    current.push({ date: session.date })
    weeklySessionsByClient.set(session.client_id, current)
  })
  const weeklyCheckinsByClient = new Map<string, Array<LatestCheckin>>()
  ;(checkins ?? []).forEach((checkin) => {
    const current = weeklyCheckinsByClient.get(checkin.client_id) ?? []
    current.push(checkin)
    weeklyCheckinsByClient.set(checkin.client_id, current)
  })
  const weeklyObjectivesByClient = new Map<string, WeeklyObjective[]>()
  ;((weeklyObjectives as WeeklyObjective[] | null) ?? []).forEach((objective) => {
    const current = weeklyObjectivesByClient.get(objective.client_id) ?? []
    current.push(objective)
    weeklyObjectivesByClient.set(objective.client_id, current)
  })
  const remindedToday = new Set(
    (todayReminders ?? []).map((item) => `${item.client_id}::${item.message}`)
  )
  const missingRoutineClients = activeClients.filter((client) => !clientsWithRoutine.has(client.id))
  const missingNutritionClients = activeClients.filter((client) => !clientsWithNutrition.has(client.id))
  const painAlertClients = activeClients.filter((client) => (latestCheckinByClient.get(client.id)?.pain_zones?.length ?? 0) > 0)
  const lowEnergyClients = activeClients.filter((client) => {
    const latestCheckin = latestCheckinByClient.get(client.id)
    return typeof latestCheckin?.energy_level === 'number' && latestCheckin.energy_level <= 2
  })
  const weeklyCheckinOverdueClients = activeClients.filter((client) => {
    const routine = (activeRoutines ?? []).find((item) => item.client_id === client.id)
    const content = routine?.content as { days?: Array<{ day?: string | null; is_rest?: boolean; exercises?: unknown[] }> } | null
    const activeDays = (content?.days ?? []).filter((day) => !day.is_rest && (day.exercises?.length ?? 0) > 0)
    const orders = activeDays
      .map((day) => getRoutineDayOrder(day.day))
      .filter((value): value is number => value >= 0)

    if (orders.length === 0) return false

    const lastDayOrder = Math.max(...orders)
    const completedLastTraining = (weeklySessionsByClient.get(client.id) ?? []).some((session) => getSessionDayOrder(session.date) === lastDayOrder)
    const hasWeeklyCheckin = (weeklyCheckinsByClient.get(client.id) ?? []).some((checkin) => checkin.type === 'weekly')

    return completedLastTraining && !hasWeeklyCheckin
  })
  const objectiveAtRiskClients = activeClients.filter((client) => {
    const objectives = weeklyObjectivesByClient.get(client.id) ?? []
    if (objectives.length === 0) return false
    const metrics = buildWeeklyObjectiveMetrics({
      sessions: weeklySessionsByClient.get(client.id),
      checkins: weeklyCheckinsByClient.get(client.id),
    })
    return objectives.some((objective) => getWeeklyObjectiveProgress(objective.metric, metrics) < objective.target_value)
  })
  const rawOnboarding = await getOnboardingProgress(supabase, user!.id)
  const derivedOnboarding = {
    created_client: rawOnboarding.created_client || allClients.length > 0,
    created_routine: rawOnboarding.created_routine || (recentRoutines?.length ?? 0) > 0,
    assigned_routine: rawOnboarding.assigned_routine || (activeRoutines?.length ?? 0) > 0,
  }
  const onboardingCompleted = derivedOnboarding.created_client && derivedOnboarding.created_routine && derivedOnboarding.assigned_routine

  if (
    derivedOnboarding.created_client !== rawOnboarding.created_client ||
    derivedOnboarding.created_routine !== rawOnboarding.created_routine ||
    derivedOnboarding.assigned_routine !== rawOnboarding.assigned_routine ||
    onboardingCompleted !== rawOnboarding.completed
  ) {
    await updateOnboardingProgress(supabase, user!.id, {
      ...derivedOnboarding,
      completed: onboardingCompleted,
    })
  }

  const attentionCards = [
    missingRoutineClients[0]
      ? {
          id: `missing-routine-${missingRoutineClients[0].id}`,
          clientId: missingRoutineClients[0].id,
          name: missingRoutineClients[0].full_name,
          client: missingRoutineClients[0],
          detail: 'Sin rutina asignada para esta fase',
          action: 'Asignar',
          tone: 'slate' as const,
          href: `/dashboard/clients/${missingRoutineClients[0].id}/routines/new`,
        }
      : null,
    missingNutritionClients[0]
      ? {
          id: `missing-nutrition-${missingNutritionClients[0].id}`,
          clientId: missingNutritionClients[0].id,
          name: missingNutritionClients[0].full_name,
          client: missingNutritionClients[0],
          detail: 'Sin plan de alimentación asignado',
          action: 'Asignar',
          tone: 'slate' as const,
          href: `/dashboard/clients/${missingNutritionClients[0].id}/nutrition/new`,
        }
      : null,
    expiredSubscriptions[0]
      ? {
          id: `renewal-${expiredSubscriptions[0].id}`,
          clientId: expiredSubscriptions[0].id,
          name: expiredSubscriptions[0].full_name,
          client: expiredSubscriptions[0],
          detail: 'Acceso vencido o en renovación',
          action: 'Revisar',
          tone: 'rose' as const,
          href: `/dashboard/clients/${expiredSubscriptions[0].id}`,
        }
      : null,
    painAlertClients[0]
      ? {
          id: `pain-alert-${painAlertClients[0].id}`,
          clientId: painAlertClients[0].id,
          name: painAlertClients[0].full_name,
          client: painAlertClients[0],
          detail: 'Reportó dolor en su último check-in',
          action: 'Revisar',
          tone: 'rose' as const,
          href: `/dashboard/clients/${painAlertClients[0].id}`,
        }
      : null,
    lowEnergyClients[0]
      ? {
          id: `low-energy-${lowEnergyClients[0].id}`,
          clientId: lowEnergyClients[0].id,
          name: lowEnergyClients[0].full_name,
          client: lowEnergyClients[0],
          detail: 'Energía baja en el último check-in',
          action: 'Revisar',
          tone: 'rose' as const,
          href: `/dashboard/clients/${lowEnergyClients[0].id}`,
        }
      : null,
    objectiveAtRiskClients[0]
      ? {
          id: `objective-risk-${objectiveAtRiskClients[0].id}`,
          clientId: objectiveAtRiskClients[0].id,
          name: objectiveAtRiskClients[0].full_name,
          client: objectiveAtRiskClients[0],
          detail: 'Tiene objetivos semanales pendientes de cumplir',
          action: 'Ajustar',
          tone: 'slate' as const,
          href: `/dashboard/clients/${objectiveAtRiskClients[0].id}`,
        }
      : null,
  ].filter(Boolean)

  const attentionClientIds = new Set([
    ...missingRoutineClients.map((client) => client.id),
    ...missingNutritionClients.map((client) => client.id),
    ...expiredSubscriptions.map((client) => client.id),
    ...painAlertClients.map((client) => client.id),
    ...lowEnergyClients.map((client) => client.id),
    ...objectiveAtRiskClients.map((client) => client.id),
  ])
  const immediateAttentionCount = attentionClientIds.size
  const trendData = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const activeAtMonth = nonPendingClients.filter((client) => {
      const subscription = subscriptionRowsByClient.get(client.id)
      if (!subscription) return false
      const createdAt = new Date(client.created_at)
      const startDate = subscription.start_date ? new Date(subscription.start_date) : createdAt
      const endDate = subscription.end_date ? new Date(subscription.end_date) : null
      return createdAt <= monthEnd && startDate <= monthEnd && (!endDate || endDate >= monthStart)
    }).length
    const totalClientsByMonth = nonPendingClients.filter((client) => new Date(client.created_at) <= monthEnd).length
    const newClients = nonPendingClients.filter((client) => {
      const createdAt = new Date(client.created_at)
      return createdAt >= monthStart && createdAt <= monthEnd
    }).length
    const churnedClients = nonPendingClients.filter((client) => {
      const subscription = subscriptionRowsByClient.get(client.id)
      if (!subscription?.end_date) return false
      const endDate = new Date(subscription.end_date)
      return endDate >= monthStart && endDate <= monthEnd && subscription.status !== 'active'
    }).length

    return {
      month: monthDate.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''),
      retention: totalClientsByMonth > 0 ? Math.round((activeAtMonth / totalClientsByMonth) * 100) : 0,
      activeClients: activeAtMonth,
      churnedClients,
      newClients,
    }
  })

  const TRAINING_REMINDER = 'Tu entrenador te recordó retomar tu entrenamiento de hoy.'
  const NUTRITION_REMINDER = 'Tu entrenador te recordó priorizar tu plan de alimentación hoy.'
  const WEEKLY_REMINDER = 'Tu entrenador te recordó completar tu check-in semanal para cerrar el seguimiento de la semana.'

  const trainingReminderCandidates = activeClients.filter((client) => {
    if (!clientsWithRoutine.has(client.id)) return false
    const latestSession = (weeklySessionsByClient.get(client.id) ?? [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    if (!latestSession) return true
    const daysSinceSession = Math.floor((todayStart.getTime() - new Date(`${latestSession.date}T00:00:00`).getTime()) / 86400000)
    return daysSinceSession >= 2
  })

  const nutritionReminderCandidates = activeClients.filter((client) => {
    if (!clientsWithNutrition.has(client.id)) return false
    const latestCheckin = latestCheckinByClient.get(client.id)
    return !latestCheckin || new Date(latestCheckin.created_at) < todayStart
  })

  const quickActionItems: QuickActionItem[] = [
    ...trainingReminderCandidates.map((client) => ({
      id: `quick-training-${client.id}`,
      clientId: client.id,
      clientName: client.full_name,
      title: 'Recordar entrenamiento',
      detail: 'No registra una sesión reciente y tiene rutina activa.',
      message: TRAINING_REMINDER,
    })),
    ...nutritionReminderCandidates.map((client) => ({
      id: `quick-nutrition-${client.id}`,
      clientId: client.id,
      clientName: client.full_name,
      title: 'Recordar alimentación',
      detail: 'Tiene plan activo, pero hoy no hay seguimiento registrado.',
      message: NUTRITION_REMINDER,
    })),
    ...weeklyCheckinOverdueClients.map((client) => ({
      id: `quick-weekly-${client.id}`,
      clientId: client.id,
      clientName: client.full_name,
      title: 'Recordar check-in semanal',
      detail: 'Terminó su última sesión semanal y aún no envía check-in.',
      message: WEEKLY_REMINDER,
    })),
  ].filter((item, index, array) =>
    array.findIndex((candidate) => candidate.id === item.id) === index
      && !remindedToday.has(`${item.clientId}::${item.message}`)
  )

  const trainerName = profile?.full_name?.split(' ')[0] ?? 'Entrenador'
  const sortedActiveClients = [...activeClients].sort((left, right) => {
    const rightActivity = latestCheckinByClient.get(right.id)?.created_at
    const leftActivity = latestCheckinByClient.get(left.id)?.created_at

    if (rightActivity && leftActivity) {
      return new Date(rightActivity).getTime() - new Date(leftActivity).getTime()
    }

    if (rightActivity) return 1
    if (leftActivity) return -1

    return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime()
  })

  const recentRoutineItems = (recentRoutines ?? []).map((routine) => ({
    id: routine.id,
    client_id: routine.client_id,
    created_at: routine.created_at,
    title: ((routine.content as RoutineSummary | null)?.title) ?? routine.title ?? 'Rutina',
    clientName: (routine.clients as { full_name?: string } | null)?.full_name ?? 'Cliente asignado',
    activityLabel: formatRelativeActivity(routine.created_at).replace('Última actividad: ', 'Actualizada '),
  }))

  return (
    <div className="max-w-full space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {now.toLocaleDateString('es-CL', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl lg:text-5xl">
            Bienvenido de vuelta, {trainerName}
          </h1>
          <p className="mt-3 text-sm text-primary sm:text-base">
            {immediateAttentionCount} clientes requieren atención inmediata
          </p>
        </div>

        <DashboardInviteButton />
      </div>

      <div className="grid max-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6 lg:space-y-8">
          {!onboardingCompleted ? (
            <OnboardingCard
              progress={{
                ...derivedOnboarding,
                completed: onboardingCompleted,
              }}
              firstClientId={allClients[0]?.id ?? null}
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Clientes activos"
              value={activeClients.length}
              helper={`+${Math.max(1, Math.floor(activeClients.length / 4))} vs. la semana pasada`}
              icon={Users}
            />
            <MetricCard
              label="Pendientes"
              value={pendingClients.length}
              helper="En proceso de onboarding"
              icon={ClipboardList}
              tone="orange"
            />
            <MetricCard
              label="Suscripciones vencidas"
              value={expiredSubscriptions.length}
              helper="Requieren renovacion"
              icon={AlertTriangle}
              tone="rose"
            />
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acción requerida</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Atención prioritaria</p>
              </div>
              <Link href="/dashboard/clients" className="text-sm font-medium text-primary transition hover:text-primary-hover">
                Ver todas las alertas
              </Link>
            </div>

            <DashboardAttentionCards
              initialCards={attentionCards.filter(Boolean).map(item => ({
                id: item!.id,
                clientId: item!.clientId,
                name: item!.name,
                detail: item!.detail,
                action: item!.action,
                tone: item!.tone,
                href: item!.href,
                remindMessage: item!.remindMessage,
              }))}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Portafolio de clientes</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Cartera activa</p>
              </div>
              <Link href="/dashboard/clients" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
                Gestionar clientes
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedActiveClients.slice(0, 3).map((client) => {
                const latestCheckin = latestCheckinByClient.get(client.id)
                const progress = latestCheckin?.nutrition_adherence
                  ? Math.min(100, latestCheckin.nutrition_adherence * 20)
                  : latestCheckin?.energy_level
                    ? Math.min(100, latestCheckin.energy_level * 20)
                    : 18

                return (
                  <PortfolioClientCard
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    name={client.full_name}
                    goal={goalLabel[client.goal] ?? client.goal}
                    status={latestCheckin ? 'Activo' : 'Alerta'}
                    progress={progress}
                    lastActivity={formatRelativeActivity(latestCheckin?.created_at)}
                    avatarUrl={client.avatar_url}
                  />
                )
              })}
            </div>
          </section>

          <TrainerPerformanceCharts data={trendData} />
        </div>

        <aside className="min-w-0 space-y-4">
          <QuickActions initialItems={quickActionItems} />

          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">Check-ins recientes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {(checkins ?? []).slice(0, 3).map((checkin) => {
                const client = activeClients.find((item) => item.id === checkin.client_id)
                return (
                  <Link key={checkin.id} href={`/dashboard/clients/${checkin.client_id}`} className="block rounded-xl border border-border bg-muted/30 p-4 transition hover:border-primary/20">
                    <p className="text-base font-semibold text-foreground">{client?.full_name ?? 'Cliente'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Registró actividad reciente</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatRelativeActivity(checkin.created_at).replace('Última actividad: ', '')}</p>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <RecentRoutinesCard routines={recentRoutineItems} />

        </aside>
      </div>
    </div>
  )
}
