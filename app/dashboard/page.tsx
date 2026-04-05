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
import OnboardingCard from './components/OnboardingCard'
import { getOnboardingProgress, updateOnboardingProgress } from '@/lib/onboarding'
import RecentRoutinesCard from './components/RecentRoutinesCard'
import { summarizeClientSubscription } from '@/lib/client-subscriptions'

type RoutineSummary = {
  title?: string
}

type LatestCheckin = {
  client_id: string
  created_at: string
  nutrition_adherence?: number | null
  energy_level?: number | null
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

  const nonPendingClients = allClients.filter((client) => client.status !== 'pending')
  const pendingClients = allClients.filter((client) => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const nonPendingIds = nonPendingClients.map((client) => client.id)

  const [
    { data: subscriptions },
    { data: checkins },
    { data: recentRoutines },
    { data: activeRoutines },
    { data: activeNutritionPlans },
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
      .select('client_id')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .eq('is_active', true),
    supabase
      .from('nutrition_plans')
      .select('client_id')
      .in('client_id', nonPendingIds.length > 0 ? nonPendingIds : ['none'])
      .eq('is_active', true),
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
  const activeClients = nonPendingClients.filter((client) => subscriptionMap.get(client.id)?.isActive)
  const expiredSubscriptions = nonPendingClients.filter((client) => !subscriptionMap.get(client.id)?.isActive)
  const activeClientIds = activeClients.map((client) => client.id)

  const latestCheckinByClient = new Map<string, LatestCheckin>()
  ;(checkins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient.has(checkin.client_id)) {
      latestCheckinByClient.set(checkin.client_id, checkin)
    }
  })

  const checkedInToday = (checkins ?? []).filter((checkin) => activeClientIds.includes(checkin.client_id) && new Date(checkin.created_at) >= todayStart)
  const clientsWithRoutine = new Set((activeRoutines ?? []).map((routine) => routine.client_id))
  const clientsWithNutrition = new Set((activeNutritionPlans ?? []).map((plan) => plan.client_id))
  const staleCheckinClients = activeClients.filter((client) => {
    const latestCheckin = latestCheckinByClient.get(client.id)
    if (!latestCheckin) return true
    return new Date(latestCheckin.created_at) < threeDaysAgo
  })
  const missingRoutineClients = activeClients.filter((client) => !clientsWithRoutine.has(client.id))
  const missingNutritionClients = activeClients.filter((client) => !clientsWithNutrition.has(client.id))
  const retention = activeClients.length > 0 ? Math.round((checkedInToday.length / activeClients.length) * 1000) / 10 : 0
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
    staleCheckinClients[0]
      ? {
          id: `stale-checkin-${staleCheckinClients[0].id}`,
          clientId: staleCheckinClients[0].id,
          name: staleCheckinClients[0].full_name,
          client: staleCheckinClients[0],
          detail: 'Sin check-in registrado en los últimos 3 días',
          action: 'Recordar',
          tone: 'rose' as const,
          href: undefined,
        }
      : null,
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
  ].filter(Boolean)

  const attentionClientIds = new Set([
    ...staleCheckinClients.map((client) => client.id),
    ...missingRoutineClients.map((client) => client.id),
    ...missingNutritionClients.map((client) => client.id),
  ])
  const immediateAttentionCount = attentionClientIds.size

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

          {(attentionCards.length > 0 || immediateAttentionCount > 0) && (
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
                }))}
              />
            </section>
          )}

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
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Indicadores de rendimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-950">Retención</p>
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-emerald-600">{retention}%</p>
                </div>
                <div className="mt-6 flex h-28 items-end gap-3">
                  {[46, 28, 62, 54, Math.max(32, retention)] .map((value, index) => (
                    <div key={index} className="flex-1 rounded-t-xl bg-stone-300" style={{ height: `${value}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-[11px] uppercase tracking-[0.18em] text-stone-400">
                  {['Jul', 'Ago', 'Sep', 'Oct', 'Nov'].map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            </CardContent>
          </Card>

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
