import { createClient } from '@/lib/supabase/server'
import ClientsDirectory from './components/ClientsDirectory'

type SortOption = 'newest' | 'oldest' | 'registration'
type FilterOption = 'all' | 'active' | 'pending' | 'expired'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: SortOption; filter?: FilterOption }>
}) {
  await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

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

  const latestCheckinByClient: Record<string, string> = {}
  ;(recentCheckins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient[checkin.client_id]) {
      latestCheckinByClient[checkin.client_id] = checkin.created_at
    }
  })

  const clientsWithRoutine = new Set((activeRoutines ?? []).map((item) => item.client_id))
  const clientsWithNutrition = new Set((activeNutrition ?? []).map((item) => item.client_id))
  const expiredPlans = activeClients.filter((client) => !clientsWithRoutine.has(client.id) && !clientsWithNutrition.has(client.id))

  return (
    <ClientsDirectory
      clients={allClients}
      activeClientIds={activeClients.map(client => client.id)}
      pendingClientIds={pendingClients.map(client => client.id)}
      expiredClientIds={[...expiredPlans, ...expiredInvites].map(client => client.id)}
      expiredInviteIds={expiredInvites.map(client => client.id)}
      latestCheckinByClient={latestCheckinByClient}
    />
  )
}
