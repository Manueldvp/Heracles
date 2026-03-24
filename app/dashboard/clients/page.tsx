import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import InviteClientDialog from './components/InviteClientDialog'
import { ActiveClientRow, ExpiredClientRow, PendingClientRow } from './components/ClientRow'

type SortOption = 'newest' | 'oldest' | 'registration'
type FilterOption = 'all' | 'active' | 'pending' | 'expired'

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

  const activeClients = allClients.filter(client => client.status !== 'pending')
  const pendingClients = allClients.filter(client => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const expiredClients = allClients.filter(client => client.status === 'pending' && client.invite_token_expires_at && new Date(client.invite_token_expires_at) < now)

  const activeIds = activeClients.map(client => client.id)
  const [{ data: activeRoutines }, { data: activeNutrition }] = await Promise.all([
    supabase.from('routines').select('client_id').in('client_id', activeIds.length > 0 ? activeIds : ['none']).eq('is_active', true),
    supabase.from('nutrition_plans').select('client_id').in('client_id', activeIds.length > 0 ? activeIds : ['none']).eq('is_active', true),
  ])

  const clientsWithRoutine = new Set((activeRoutines ?? []).map(item => item.client_id))
  const clientsWithNutrition = new Set((activeNutrition ?? []).map(item => item.client_id))
  const expiredPlanningClients = activeClients.filter(client => !clientsWithRoutine.has(client.id) && !clientsWithNutrition.has(client.id))

  const sections = [
    { id: 'active', title: 'Active clients', description: 'Clientes activos con acceso vigente.', items: activeClients },
    { id: 'pending', title: 'Pending clients', description: 'Invitaciones enviadas pendientes de aceptación.', items: pendingClients },
    { id: 'expired', title: 'Expired plans', description: 'Clientes activos sin rutina ni nutrición activa.', items: expiredPlanningClients },
    { id: 'expired_invites', title: 'Expired invites', description: 'Invitaciones vencidas que necesitan reenvío.', items: expiredClients },
  ] as const

  const filteredSections = sections.map(section => {
    if (filter === 'all') return section
    const matchesFilter =
      filter === 'expired'
        ? section.id === 'expired' || section.id === 'expired_invites'
        : section.id === filter

    return { ...section, items: matchesFilter ? section.items : [] }
  })

  const sortLinks: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: 'Más nuevos' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'registration', label: 'Registro' },
  ]

  const filterLinks: Array<{ value: FilterOption; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'expired', label: 'Expirados' },
  ]

  const orderedSections = sort === 'registration'
    ? filteredSections
    : filteredSections.map(section => ({
        ...section,
        items: [...section.items].sort((a, b) => {
          const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          return sort === 'oldest' ? diff : -diff
        }),
      }))

  const hasClients = allClients.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Clientes</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeClients.length} activos · {pendingClients.length} pendientes · {expiredPlanningClients.length + expiredClients.length} con atención pendiente
          </p>
        </div>
        <InviteClientDialog />
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            {sortLinks.map(link => (
              <Link
                key={link.value}
                href={`/dashboard/clients?sort=${link.value}&filter=${filter}`}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  sort === link.value
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {filterLinks.map(link => (
              <Link
                key={link.value}
                href={`/dashboard/clients?sort=${sort}&filter=${link.value}`}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  filter === link.value
                    ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hasClients && (
        <Card className="bg-zinc-900 border-dashed border-zinc-700">
          <CardContent className="py-16 text-center">
            <p className="text-lg text-zinc-300">No tienes clientes todavía.</p>
            <p className="mt-2 text-sm text-zinc-500">Envía una invitación para empezar a trabajar con tu primer cliente.</p>
            <div className="mt-5 flex justify-center">
              <InviteClientDialog />
            </div>
          </CardContent>
        </Card>
      )}

      {orderedSections.map(section => (
        section.items.length > 0 ? (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                <p className="text-xs text-zinc-500">{section.description}</p>
              </div>
              <Badge className="border-zinc-700 bg-zinc-950 text-zinc-300">{section.items.length}</Badge>
            </div>
            <div className="space-y-3">
              {section.id === 'active' && section.items.map(client => <ActiveClientRow key={client.id} client={client} />)}
              {section.id === 'pending' && section.items.map(client => <PendingClientRow key={client.id} client={client} />)}
              {section.id === 'expired' && section.items.map(client => <ExpiredClientRow key={client.id} client={client} variant="plan" />)}
              {section.id === 'expired_invites' && section.items.map(client => <ExpiredClientRow key={client.id} client={client} variant="invite" />)}
            </div>
          </div>
        ) : null
      ))}
    </div>
  )
}
