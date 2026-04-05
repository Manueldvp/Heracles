import { createClient } from '@/lib/supabase/server'
import ClientsDirectory from './components/ClientsDirectory'
import { summarizeClientSubscription } from '@/lib/client-subscriptions'

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
    .select('*, client_subscriptions(status, end_date)')
    .order('created_at', { ascending: false })

  const allClients = (clients ?? []).map((client) => {
    const subscription = Array.isArray(client.client_subscriptions)
      ? client.client_subscriptions[0]
      : client.client_subscriptions

    return {
      ...client,
      subscription_status: subscription?.status ?? null,
      subscription_end_date: subscription?.end_date ?? null,
    }
  })
  const now = new Date()
  const activeClients = allClients.filter((client) => client.status !== 'pending')
  const pendingClients = allClients.filter((client) => client.status === 'pending' && (!client.invite_token_expires_at || new Date(client.invite_token_expires_at) >= now))
  const expiredInvites = allClients.filter((client) => client.status === 'pending' && client.invite_token_expires_at && new Date(client.invite_token_expires_at) < now)

  const activeIds = activeClients.map((client) => client.id)

  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('client_id, created_at')
    .in('client_id', activeIds.length > 0 ? activeIds : ['none'])
    .order('created_at', { ascending: false })

  const latestCheckinByClient: Record<string, string> = {}
  ;(recentCheckins ?? []).forEach((checkin) => {
    if (!latestCheckinByClient[checkin.client_id]) {
      latestCheckinByClient[checkin.client_id] = checkin.created_at
    }
  })

  const subscriptionMap = new Map(
    activeClients.map((client) => [
      client.id,
      summarizeClientSubscription({
        id: client.id,
        client_id: client.id,
        trainer_id: '',
        start_date: '',
        status: client.subscription_status ?? undefined,
        end_date: client.subscription_end_date ?? undefined,
      }),
    ]),
  )

  const activeSubscriptionClients = activeClients.filter((client) => subscriptionMap.get(client.id)?.isActive)
  const expiredSubscriptionClients = activeClients.filter((client) => !subscriptionMap.get(client.id)?.isActive)

  return (
    <ClientsDirectory
      clients={allClients}
      activeClientIds={activeSubscriptionClients.map(client => client.id)}
      pendingClientIds={pendingClients.map(client => client.id)}
      expiredClientIds={[...expiredSubscriptionClients, ...expiredInvites].map(client => client.id)}
      expiredInviteIds={expiredInvites.map(client => client.id)}
      latestCheckinByClient={latestCheckinByClient}
    />
  )
}
