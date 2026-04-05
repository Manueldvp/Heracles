'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import InviteClientDialog from './InviteClientDialog'
import ClientGridCard from './ClientGridCard'
import { getClientSubscriptionIndicator } from '@/lib/client-subscriptions'

type SortOption = 'newest' | 'oldest' | 'registration'
type FilterOption = 'all' | 'active' | 'pending' | 'expired'

type ClientRecord = {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
  invite_token_expires_at?: string | null
  avatar_url?: string | null
  subscription_status?: 'active' | 'expired' | 'paused' | null
  subscription_end_date?: string | null
}

function formatLastActivity(date?: string) {
  if (!date) return 'Sin actividad reciente'

  const target = new Date(date)
  const diffDays = Math.floor((Date.now() - target.getTime()) / 86400000)

  if (diffDays <= 0) return 'Actividad hoy'
  if (diffDays === 1) return 'Última actividad: hace 1 día'
  return `Última actividad: hace ${diffDays} días`
}

export default function ClientsDirectory({
  clients,
  activeClientIds,
  pendingClientIds,
  expiredClientIds,
  expiredInviteIds,
  latestCheckinByClient,
}: {
  clients: ClientRecord[]
  activeClientIds: string[]
  pendingClientIds: string[]
  expiredClientIds: string[]
  expiredInviteIds: string[]
  latestCheckinByClient: Record<string, string>
}) {
  const [sort, setSort] = useState<SortOption>('newest')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [query, setQuery] = useState('')

  const activeIdSet = useMemo(() => new Set(activeClientIds), [activeClientIds])
  const pendingIdSet = useMemo(() => new Set(pendingClientIds), [pendingClientIds])
  const expiredIdSet = useMemo(() => new Set(expiredClientIds), [expiredClientIds])
  const expiredInviteSet = useMemo(() => new Set(expiredInviteIds), [expiredInviteIds])

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const base = clients.filter(client => {
      if (filter === 'active' && !activeIdSet.has(client.id)) return false
      if (filter === 'pending' && !pendingIdSet.has(client.id)) return false
      if (filter === 'expired' && !expiredIdSet.has(client.id)) return false

      if (!normalizedQuery) return true

      return [client.full_name, client.email, latestCheckinByClient[client.id]]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery))
    })

    if (sort === 'registration') return base

    return [...base].sort((a, b) => {
      const subscriptionOrderDiff = (() => {
        const leftPending = a.status === 'pending'
        const rightPending = b.status === 'pending'

        if (leftPending || rightPending) {
          if (leftPending && rightPending) return 0
          return leftPending ? 1 : -1
        }

        const leftIndicator = getClientSubscriptionIndicator({
          status: a.subscription_status ?? undefined,
          end_date: a.subscription_end_date ?? undefined,
        })
        const rightIndicator = getClientSubscriptionIndicator({
          status: b.subscription_status ?? undefined,
          end_date: b.subscription_end_date ?? undefined,
        })

        return leftIndicator.sortOrder - rightIndicator.sortOrder
      })()

      if (subscriptionOrderDiff !== 0) return subscriptionOrderDiff

      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sort === 'oldest' ? diff : -diff
    })
  }, [activeIdSet, clients, expiredIdSet, filter, latestCheckinByClient, pendingIdSet, query, sort])

  const activeClients = clients.filter(client => activeIdSet.has(client.id))
  const pendingClients = clients.filter(client => pendingIdSet.has(client.id))
  const expiredClients = clients.filter(client => expiredIdSet.has(client.id))
  const inactiveClients = activeClients.filter(client => !latestCheckinByClient[client.id])

  const filterLinks: Array<{ value: FilterOption; label: string; count: number }> = [
    { value: 'all', label: 'Todos', count: clients.length },
    { value: 'active', label: 'Activos', count: activeClients.length },
    { value: 'pending', label: 'Pendientes', count: pendingClients.length },
    { value: 'expired', label: 'Expirados', count: expiredClients.length },
  ]

  const sortLinks: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: 'Más nuevos' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'registration', label: 'Fecha de registro' },
  ]

  const sectionTitle = filter === 'all'
    ? 'Clientes'
    : filter === 'active'
      ? 'Clientes activos'
      : filter === 'pending'
        ? 'Clientes pendientes'
        : 'Clientes que requieren atención'

  const sectionDescription = filter === 'all'
    ? 'Vista completa de clientes, invitaciones y suscripciones por renovar.'
    : filter === 'active'
      ? 'Clientes con acceso y seguimiento vigente.'
      : filter === 'pending'
        ? 'Invitaciones y onboardings pendientes.'
        : 'Clientes sin actividad reciente o con suscripcion vencida o pausada.'

  return (
    <div className="max-w-full space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Sistema de clientes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">Clientes</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Gestiona clientes activos, pendientes y suscripciones vencidas desde una sola vista operativa.
          </p>
        </div>
        <InviteClientDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Clientes activos</p>
            <p className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">{activeClients.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Clientes con acceso y seguimiento activo.</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Clientes pendientes</p>
            <p className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">{pendingClients.length}</p>
            <p className="mt-2 text-sm text-primary">Invitaciones esperando registro.</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-red-500/20 bg-red-500/10 shadow-sm md:col-span-2 xl:col-span-1">
          <CardContent className="p-6">
            <p className="text-sm text-red-400">Atención prioritaria</p>
            <p className="mt-4 text-2xl font-bold text-red-400 sm:text-3xl">{inactiveClients.length + expiredClients.length}</p>
            <p className="mt-2 text-sm text-red-400">Clientes sin actividad o con acceso vencido.</p>
          </CardContent>
        </Card>
      </div>

      {(inactiveClients.length > 0 || expiredClients.length > 0) && (
        <Card className="rounded-xl border border-red-500/20 bg-red-500/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">Clientes que requieren atención</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {inactiveClients.slice(0, 2).map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="rounded-xl border border-red-500/20 bg-background p-4 transition hover:border-red-500/30">
                  <p className="text-lg font-semibold text-foreground">{client.full_name}</p>
                  <p className="mt-2 text-sm text-red-400">Sin check-ins recientes</p>
                </Link>
              ))}
              {expiredClients.slice(0, 2).map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="rounded-xl border border-red-500/20 bg-background p-4 transition hover:border-red-500/30">
                  <p className="text-lg font-semibold text-foreground">{client.full_name}</p>
                  <p className="mt-2 text-sm text-red-400">Suscripcion vencida o pausada</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-full lg:max-w-md lg:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar clientes, estado o actividad..."
              className="h-12 w-full rounded-xl border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterLinks.map((link) => (
              <button
                key={link.value}
                type="button"
                onClick={() => setFilter(link.value)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  filter === link.value
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                }`}
              >
                {link.label} ({link.count})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {sortLinks.map((link) => (
              <button
                key={link.value}
                type="button"
                onClick={() => setSort(link.value)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  sort === link.value
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <Card className="rounded-xl border border-dashed border-border bg-card shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">Todavía no tienes clientes.</p>
              <p className="mt-2 text-sm text-muted-foreground">Envía una invitación para empezar a trabajar con tu primer cliente.</p>
            </div>
            <InviteClientDialog />
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{sectionTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{sectionDescription}</p>
            </div>
            <div className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
              {filteredClients.length}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => {
              const latestActivity = latestCheckinByClient[client.id]
              const isPending = client.status === 'pending'
              const isExpiredInvite = expiredInviteSet.has(client.id)
              const isExpiredPlan = expiredIdSet.has(client.id) && !isPending
              const subscriptionBadge = isPending
                ? null
                : getClientSubscriptionIndicator({
                    status: client.subscription_status ?? undefined,
                    end_date: client.subscription_end_date ?? undefined,
                  })

              return (
                <ClientGridCard
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  name={client.full_name || client.email}
                  subtitle={isPending ? client.email : 'Seguimiento activo'}
                  status={isPending ? (isExpiredInvite ? 'expired' : 'pending') : isExpiredPlan ? 'expired' : 'active'}
                  subscriptionBadge={subscriptionBadge}
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
                      ? subscriptionBadge?.label === 'Sin plan'
                        ? 'Este cliente todavía no tiene una suscripción asignada.'
                        : 'Requiere revisión o renovación de su acceso.'
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
      )}
    </div>
  )
}
