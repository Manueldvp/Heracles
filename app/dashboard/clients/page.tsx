import Link from 'next/link'
import { AlertTriangle, Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import InviteClientDialog from './components/InviteClientDialog'
import ClientGridCard from './components/ClientGridCard'

type SortOption = 'newest' | 'oldest' | 'registration'
type FilterOption = 'all' | 'active' | 'pending' | 'expired'

function formatLastActivity(date?: string) {
  if (!date) return 'Sin actividad reciente'

  const target = new Date(date)
  const diffDays = Math.floor((Date.now() - target.getTime()) / 86400000)

  if (diffDays <= 0) return 'Actividad hoy'
  if (diffDays === 1) return 'Última actividad: hace 1 día'
  return `Última actividad: hace ${diffDays} días`
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: SortOption; filter?: FilterOption }>
}) {
  const { sort = 'newest', filter = 'all' } = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: sort === 'oldest' })

  const allClients = clients ?? []
  const now = new Date()
  const activeClients = allClients.filter((client) => client.status !== 'pending')
  const pendingClients = allClients.filter((client) => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const expiredInvites = allClients.filter((client) => client.status === 'pending' && client.invite_token_expires_at && new Date(client.invite_token_expires_at) < now)

  const activeIds = activeClients.map((client) => client.id)

  const [
    { data: activeRoutines },
    { data: activeNutrition },
    { data: recentCheckins },
  ] = await Promise.all([
    supabase.from('routines').select('client_id').in('client_id', activeIds.length > 0 ? activeIds : ['none']).eq('is_active', true),
    supabase.from('nutrition_plans').select('client_id').in('client_id', activeIds.length > 0 ? activeIds : ['none']).eq('is_active', true),
    supabase.from('checkins').select('client_id, created_at').in('client_id', activeIds.length > 0 ? activeIds : ['none']).order('created_at', { ascending: false }),
  ])

  const latestCheckinByClient = new Map<string, string>()
  ;(recentCheckins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient.has(checkin.client_id)) {
      latestCheckinByClient.set(checkin.client_id, checkin.created_at)
    }
  })

  const clientsWithRoutine = new Set((activeRoutines ?? []).map((item) => item.client_id))
  const clientsWithNutrition = new Set((activeNutrition ?? []).map((item) => item.client_id))
  const expiredPlans = activeClients.filter((client) => !clientsWithRoutine.has(client.id) && !clientsWithNutrition.has(client.id))
  const inactiveClients = activeClients.filter((client) => !latestCheckinByClient.has(client.id))

  const sections = [
    { id: 'active', title: 'Clientes activos', description: 'Clientes activos con seguimiento vigente.', items: activeClients },
    { id: 'pending', title: 'Clientes pendientes', description: 'Clientes en proceso de registro u onboarding.', items: pendingClients },
    { id: 'expired', title: 'Planes vencidos', description: 'Clientes que requieren nueva planificación.', items: [...expiredPlans, ...expiredInvites] },
  ] as const

  const filteredSections = sections.map((section) => {
    if (filter === 'all') return section
    return { ...section, items: section.id === filter ? section.items : [] }
  })

  const orderedSections = sort === 'registration'
    ? filteredSections
    : filteredSections.map((section) => ({
        ...section,
        items: [...section.items].sort((a, b) => {
          const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          return sort === 'oldest' ? diff : -diff
        }),
      }))

  const filterLinks: Array<{ value: FilterOption; label: string; count: number }> = [
    { value: 'all', label: 'Todos', count: allClients.length },
    { value: 'active', label: 'Activos', count: activeClients.length },
    { value: 'pending', label: 'Pendientes', count: pendingClients.length },
    { value: 'expired', label: 'Expirados', count: expiredPlans.length + expiredInvites.length },
  ]

  const sortLinks: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: 'Más nuevos' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'registration', label: 'Fecha de registro' },
  ]

  return (
    <div className="max-w-full space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Sistema de clientes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-4xl">Clientes</h1>
          <p className="mt-3 max-w-2xl text-base text-stone-600 sm:text-lg">
            Gestiona clientes activos, pendientes y planes vencidos desde una sola vista operativa.
          </p>
        </div>
        <InviteClientDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Clientes activos</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-5xl">{activeClients.length}</p>
            <p className="mt-2 text-sm text-emerald-600">Clientes con acceso y seguimiento activo.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Clientes pendientes</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-5xl">{pendingClients.length}</p>
            <p className="mt-2 text-sm text-orange-600">Invitaciones esperando registro.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm md:col-span-2 xl:col-span-1">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Atención prioritaria</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-rose-600 sm:text-5xl">{inactiveClients.length + expiredPlans.length}</p>
            <p className="mt-2 text-sm text-rose-500">Clientes sin actividad o con planificación vencida.</p>
          </CardContent>
        </Card>
      </div>

      {(inactiveClients.length > 0 || expiredPlans.length > 0) && (
        <Card className="rounded-3xl border-stone-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Clientes que requieren atención</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {inactiveClients.slice(0, 2).map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-orange-200">
                  <p className="text-lg font-semibold text-stone-950">{client.full_name}</p>
                  <p className="mt-2 text-sm text-orange-600">Sin check-ins recientes</p>
                </Link>
              ))}
              {expiredPlans.slice(0, 2).map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-orange-200">
                  <p className="text-lg font-semibold text-stone-950">{client.full_name}</p>
                  <p className="mt-2 text-sm text-orange-600">Sin rutina ni nutrición activa</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-stone-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-full lg:max-w-md lg:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              type="text"
              placeholder="Buscar clientes, estado o actividad..."
              className="h-12 w-full rounded-2xl border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterLinks.map((link) => (
              <Link
                key={link.value}
                href={`/dashboard/clients?sort=${sort}&filter=${link.value}`}
                className={`rounded-2xl px-4 py-2 text-sm transition ${
                  filter === link.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-stone-100 text-stone-500 hover:text-stone-900'
                }`}
              >
                {link.label} ({link.count})
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {sortLinks.map((link) => (
              <Link
                key={link.value}
                href={`/dashboard/clients?sort=${link.value}&filter=${filter}`}
                className={`rounded-2xl px-4 py-2 text-sm transition ${
                  sort === link.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-stone-100 text-stone-500 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {orderedSections.map((section) => (
        section.items.length > 0 ? (
          <section key={section.id} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-stone-500">{section.title}</p>
                <p className="mt-2 text-sm text-stone-600">{section.description}</p>
              </div>
              <div className="flex h-10 min-w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white px-3 text-sm text-stone-600">
                {section.items.length}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((client) => {
                const latestActivity = latestCheckinByClient.get(client.id)
                const isPending = client.status === 'pending'
                const isExpiredInvite = expiredInvites.some((item) => item.id === client.id)
                const isExpiredPlan = expiredPlans.some((item) => item.id === client.id)

                return (
                  <ClientGridCard
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    name={client.full_name || client.email}
                    subtitle={isPending ? client.email : 'Seguimiento activo'}
                    status={isPending ? (isExpiredInvite ? 'expired' : 'pending') : isExpiredPlan ? 'expired' : 'active'}
                    lastActivity={
                      isPending
                        ? client.invite_token_expires_at
                          ? `Invitación ${isExpiredInvite ? 'vencida' : 'expira'} ${new Date(client.invite_token_expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
                          : 'Pendiente de registro'
                        : formatLastActivity(latestActivity)
                    }
                    avatarUrl={client.avatar_url}
                    note={
                      isExpiredPlan
                        ? 'Requiere nueva rutina o nutrición.'
                        : latestActivity
                          ? 'Cliente con actividad registrada.'
                          : isPending
                            ? 'Esperando aceptación de la invitación.'
                            : 'Sin actividad reciente.'
                    }
                  />
                )
              })}
            </div>
          </section>
        ) : null
      ))}

      {allClients.length === 0 && (
        <Card className="rounded-3xl border-dashed border-stone-300 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-semibold text-stone-950">Todavía no tienes clientes.</p>
              <p className="mt-2 text-sm text-stone-500">Envía una invitación para empezar a trabajar con tu primer cliente.</p>
            </div>
            <InviteClientDialog />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
