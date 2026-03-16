import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ActiveClientRow, PendingClientRow } from './components/ClientRow'
import InviteClientDialog from './components/InviteClientDialog'
import { Users } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const activeClients  = clients?.filter(c => c.status !== 'pending') ?? []
  const pendingClients = clients?.filter(c => c.status === 'pending')  ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-zinc-500 text-sm mt-1">
            {activeClients.length} activos
            {pendingClients.length > 0 && ` · ${pendingClients.length} pendientes`}
          </p>
        </div>
        <InviteClientDialog />
      </div>

      {/* Empty state */}
      {clients?.length === 0 && (
        <Card className="bg-zinc-900 border-dashed border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Users size={48} className="text-zinc-600" />
            <p className="text-zinc-400 text-lg">No tienes clientes aún</p>
            <p className="text-zinc-500 text-sm">Invita a tu primer cliente para comenzar</p>
            <InviteClientDialog />
          </CardContent>
        </Card>
      )}

      {/* Active clients */}
      {activeClients.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {activeClients.map(client => (
            <ActiveClientRow key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Pending invitations */}
      {pendingClients.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-zinc-500 text-xs uppercase tracking-widest px-1">
            Invitaciones pendientes
          </p>
          {pendingClients.map(client => (
            <PendingClientRow key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
