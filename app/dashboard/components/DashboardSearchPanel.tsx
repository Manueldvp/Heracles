'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type SearchClient = {
  id: string
  full_name: string
  email?: string | null
}

type SearchRoutine = {
  id: string
  client_id: string
  title: string
  clientName: string
}

export default function DashboardSearchPanel({
  clients,
  routines,
}: {
  clients: SearchClient[]
  routines: SearchRoutine[]
}) {
  const [query, setQuery] = useState('')

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clients.slice(0, 4)

    return clients
      .filter((client) =>
        [client.full_name, client.email].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized))
      )
      .slice(0, 4)
  }, [clients, query])

  const filteredRoutines = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return routines.slice(0, 4)

    return routines
      .filter((routine) =>
        [routine.title, routine.clientName].some((value) => value.toLowerCase().includes(normalized))
      )
      .slice(0, 4)
  }, [query, routines])

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Buscar clientes y rutinas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca por cliente, email o rutina..."
            className="h-11 rounded-xl border-border bg-background pl-11"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Clientes</p>
            <div className="space-y-2">
              {filteredClients.length > 0 ? filteredClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="block rounded-xl border border-border bg-muted/30 p-3 transition hover:border-primary/20 hover:bg-primary/5"
                >
                  <p className="text-sm font-medium text-foreground">{client.full_name}</p>
                  {client.email ? <p className="mt-1 text-xs text-muted-foreground">{client.email}</p> : null}
                </Link>
              )) : (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sin clientes que coincidan.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Rutinas</p>
            <div className="space-y-2">
              {filteredRoutines.length > 0 ? filteredRoutines.map((routine) => (
                <Link
                  key={routine.id}
                  href={`/dashboard/clients/${routine.client_id}/routines/${routine.id}`}
                  className="block rounded-xl border border-border bg-muted/30 p-3 transition hover:border-primary/20 hover:bg-primary/5"
                >
                  <p className="text-sm font-medium text-foreground">{routine.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{routine.clientName}</p>
                </Link>
              )) : (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sin rutinas que coincidan.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
