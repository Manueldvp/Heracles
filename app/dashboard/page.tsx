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
import PriorityAttentionCard from './components/PriorityAttentionCard'

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
  muscle_gain: 'Muscle gain',
  fat_loss: 'Weight loss',
  maintenance: 'Maintenance',
  strength: 'Strength',
  endurance: 'Endurance',
  general: 'General',
}

function formatRelativeActivity(date?: string) {
  if (!date) return 'Sin actividad reciente'

  const target = new Date(date)
  const diffDays = Math.floor((Date.now() - target.getTime()) / 86400000)

  if (diffDays <= 0) return 'Last: today'
  if (diffDays === 1) return 'Last: 1 day ago'
  return `Last: ${diffDays} days ago`
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

  const attentionCards = [
    inactiveClients[0]
      ? {
          client: inactiveClients[0],
          detail: 'No activity logged for 5 days',
          action: 'Remind',
          tone: 'rose' as const,
        }
      : null,
    missingRoutineClients[0]
      ? {
          client: missingRoutineClients[0],
          detail: 'No routine assigned for this phase',
          action: 'Assign',
          tone: 'slate' as const,
        }
      : null,
  ].filter(Boolean)

  const trainerName = profile?.full_name?.split(' ')[0] ?? 'Coach'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-zinc-500" />
              {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
            Welcome back, {trainerName}
          </h1>
          <p className="mt-3 text-lg text-orange-200">
            {inactiveClients.length + missingRoutineClients.length} clients requiring immediate attention
          </p>
        </div>

        <DashboardInviteButton />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Active clients"
              value={activeClients.length}
              helper={`+${Math.max(1, Math.floor(activeClients.length / 4))} from last week`}
              icon={Users}
            />
            <MetricCard
              label="Pending"
              value={pendingClients.length}
              helper="In onboarding flow"
              icon={ClipboardList}
              tone="orange"
            />
            <MetricCard
              label="Expired plans"
              value={expiredPlans.length}
              helper="Renewal required"
              icon={AlertTriangle}
              tone="rose"
            />
          </div>

          {(attentionCards.length > 0 || inactiveClients.length > 0 || missingRoutineClients.length > 0) && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Action required</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Priority attention</p>
                </div>
                <Link href="/dashboard/clients" className="text-sm font-medium text-orange-200 transition hover:text-orange-100">
                  View all alerts
                </Link>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {attentionCards.map((item) => (
                  item ? (
                    <PriorityAttentionCard
                      key={item.client.id}
                      href={`/dashboard/clients/${item.client.id}`}
                      name={item.client.full_name}
                      detail={item.detail}
                      actionLabel={item.action}
                      tone={item.tone}
                    />
                  ) : null
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Client portfolio</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Active roster</p>
              </div>
              <Link href="/dashboard/clients" className="text-sm font-medium text-zinc-400 transition hover:text-white">
                Manage clients
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
                    status={latestCheckin ? 'Active' : 'Alert'}
                    progress={progress}
                    lastActivity={formatRelativeActivity(latestCheckin?.created_at)}
                    avatarUrl={client.avatar_url}
                  />
                )
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="border-zinc-800 bg-[#151c31]">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.26em] text-zinc-500">Performance insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-zinc-800 bg-[#0f1629] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Retention</p>
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-emerald-300">{retention}%</p>
                </div>
                <div className="mt-6 flex h-28 items-end gap-3">
                  {[46, 28, 62, 54, Math.max(32, retention)] .map((value, index) => (
                    <div key={index} className="flex-1 rounded-t-xl bg-zinc-700/60" style={{ height: `${value}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                  {['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-[#151c31]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-[0.26em] text-zinc-500">Recent check-ins</CardTitle>
              <Activity className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              {(checkins ?? []).slice(0, 3).map((checkin) => {
                const client = activeClients.find((item) => item.id === checkin.client_id)
                return (
                  <Link key={checkin.id} href={`/dashboard/clients/${checkin.client_id}`} className="block rounded-2xl border border-zinc-800 bg-[#0f1629] p-4 transition hover:border-zinc-700">
                    <p className="text-base font-semibold text-white">{client?.full_name ?? 'Client'}</p>
                    <p className="mt-1 text-sm text-zinc-400">Morning session complete</p>
                    <p className="mt-2 text-xs text-zinc-600">{formatRelativeActivity(checkin.created_at).replace('Last: ', '')}</p>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-[#151c31]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-[0.26em] text-zinc-500">Recent routines</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentRoutines ?? []).map((routine) => (
                <Link key={routine.id} href={`/dashboard/clients/${routine.client_id}`} className="block rounded-2xl border border-zinc-800 bg-[#0f1629] p-4 transition hover:border-zinc-700">
                  <p className="text-base font-semibold text-white">
                    {((routine.content as RoutineSummary | null)?.title) ?? routine.title ?? 'Routine'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{(routine.clients as { full_name?: string } | null)?.full_name ?? 'Client assigned'}</p>
                  <p className="mt-2 text-xs text-zinc-600">{formatRelativeActivity(routine.created_at).replace('Last: ', 'Updated ')}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-zinc-700 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_36%),linear-gradient(180deg,#2a2534_0%,#211d28_100%)]">
            <CardContent className="p-6">
              <p className="text-2xl font-semibold tracking-[-0.04em] text-white">Treinex Pro+</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Unlock deeper recovery insights and more advanced automation for your roster.
              </p>
              <button className="mt-6 h-11 w-full rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100">
                Upgrade plan
              </button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
