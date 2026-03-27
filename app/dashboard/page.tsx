import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  BarChart3,
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
import { Badge } from '@/components/ui/badge'
import { getTrainerBillingStatus } from '@/lib/billing'

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
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)

  const activeClients = allClients.filter((client) => client.status !== 'pending')
  const pendingClients = allClients.filter((client) => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const activeIds = activeClients.map((client) => client.id)

  const [
    { data: checkins },
    { data: recentRoutines },
    { data: activeRoutines },
    { data: activeNutrition },
  ] = await Promise.all([
    supabase
      .from('checkins')
      .select('*')
      .in('client_id', activeIds.length > 0 ? activeIds : ['none'])
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('routines')
      .select('*, clients(full_name)')
      .in('client_id', activeIds.length > 0 ? activeIds : ['none'])
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('routines')
      .select('client_id')
      .in('client_id', activeIds.length > 0 ? activeIds : ['none'])
      .eq('is_active', true),
    supabase
      .from('nutrition_plans')
      .select('client_id')
      .in('client_id', activeIds.length > 0 ? activeIds : ['none'])
      .eq('is_active', true),
  ])

  const latestCheckinByClient = new Map<string, LatestCheckin>()
  ;(checkins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient.has(checkin.client_id)) {
      latestCheckinByClient.set(checkin.client_id, checkin)
    }
  })

  const checkedInToday = (checkins ?? []).filter((checkin) => new Date(checkin.created_at) >= todayStart)
  const clientsWithRoutine = new Set((activeRoutines ?? []).map((routine) => routine.client_id))
  const clientsWithNutrition = new Set((activeNutrition ?? []).map((plan) => plan.client_id))
  const expiredPlans = activeClients.filter((client) => !clientsWithRoutine.has(client.id) && !clientsWithNutrition.has(client.id))
  const inactiveClients = activeClients.filter((client) => !latestCheckinByClient.has(client.id))
  const missingRoutineClients = activeClients.filter((client) => !clientsWithRoutine.has(client.id))
  const retention = activeClients.length > 0 ? Math.round((checkedInToday.length / activeClients.length) * 1000) / 10 : 0
  const billing = await getTrainerBillingStatus(supabase, user!.id)

  const attentionCards = [
    inactiveClients[0]
      ? {
          id: `inactive-${inactiveClients[0].id}`,
          clientId: inactiveClients[0].id,
          name: inactiveClients[0].full_name,
          client: inactiveClients[0],
          detail: 'Sin actividad registrada en los últimos 5 días',
          action: 'Recordar',
          tone: 'rose' as const,
        }
      : null,
    missingRoutineClients[0]
      ? {
          id: `missing-${missingRoutineClients[0].id}`,
          clientId: missingRoutineClients[0].id,
          name: missingRoutineClients[0].full_name,
          client: missingRoutineClients[0],
          detail: 'Sin rutina asignada para esta fase',
          action: 'Asignar',
          tone: 'slate' as const,
        }
      : null,
  ].filter(Boolean)

  const trainerName = profile?.full_name?.split(' ')[0] ?? 'Entrenador'

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
            {inactiveClients.length + missingRoutineClients.length} clientes requieren atención inmediata
          </p>
        </div>

        <DashboardInviteButton />
      </div>

      <div className="grid max-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6 lg:space-y-8">
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
              label="Planes vencidos"
              value={expiredPlans.length}
              helper="Requieren renovación"
              icon={AlertTriangle}
              tone="rose"
            />
          </div>

          {(attentionCards.length > 0 || inactiveClients.length > 0 || missingRoutineClients.length > 0) && (
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
              {activeClients.slice(0, 3).map((client) => {
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

          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">Rutinas recientes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentRoutines ?? []).map((routine) => (
                <Link key={routine.id} href={`/dashboard/clients/${routine.client_id}`} className="block rounded-xl border border-border bg-muted/30 p-4 transition hover:border-primary/20">
                  <p className="text-base font-semibold text-foreground">
                    {((routine.content as RoutineSummary | null)?.title) ?? routine.title ?? 'Rutina'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{(routine.clients as { full_name?: string } | null)?.full_name ?? 'Cliente asignado'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatRelativeActivity(routine.created_at).replace('Última actividad: ', 'Actualizada ')}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {billing.subscription.planType === 'premium' ? 'Plan Premium' : 'Plan Free'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billing.subscription.planType === 'premium'
                      ? 'Clientes e IA sin límites activos.'
                      : `${billing.clientCount}/${billing.subscription.clientLimit ?? 5} clientes usados · ${billing.aiGenerationsUsed}/3 generaciones IA este mes.`}
                  </p>
                </div>
                <Badge>{billing.subscription.planType === 'premium' ? 'Activo' : 'Upgrade'}</Badge>
              </div>
              {billing.subscription.planType !== 'premium' ? (
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-sm font-medium text-primary">Desbloquea Premium al superar 5 clientes</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mantén control sobre tu crecimiento y evita quedarte sin IA durante el mes.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
