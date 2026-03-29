'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import TrainerDrawerWrapper from './TrainerDrawerWrapper'
import ThemeToggle from '@/components/theme-toggle'

type Props = {
  email: string
  trainerName: string
  trainerId: string
  avatarUrl?: string
  searchClients: Array<{ id: string; full_name: string; email?: string | null }>
  searchRoutines: Array<{ id: string; client_id: string; title: string; clientName: string }>
}

const navItems = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/clients', label: 'Clientes' },
  { href: '/dashboard/forms', label: 'Formularios' },
]

export default function DashboardTopbar({
  email,
  trainerName,
  trainerId,
  avatarUrl = '',
  searchClients,
  searchRoutines,
}: Props) {
  const pathname = usePathname()
  const query = pathname.includes('?q=') ? decodeURIComponent(pathname.split('?q=')[1] ?? '') : ''
  const [search, setSearch] = useState(query)
  const [open, setOpen] = useState(false)

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return searchClients.slice(0, 4)
    return searchClients
      .filter((client) =>
        [client.full_name, client.email].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized))
      )
      .slice(0, 4)
  }, [search, searchClients])

  const filteredRoutines = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return searchRoutines.slice(0, 4)
    return searchRoutines
      .filter((routine) => [routine.title, routine.clientName].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 4)
  }, [search, searchRoutines])

  return (
    <header className="sticky top-0 z-30 max-w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-20 max-w-full items-center gap-3 overflow-x-hidden px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-lg font-semibold tracking-[-0.04em] text-primary">Treinex</p>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 150)}
              type="text"
              placeholder="Buscar clientes o rutinas..."
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
            {open ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-2xl border border-border bg-card p-3 shadow-xl">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clientes</p>
                    {filteredClients.length > 0 ? filteredClients.map((client) => (
                      <Link
                        key={client.id}
                        href={`/dashboard/clients/${client.id}`}
                        className="block rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm transition hover:border-primary/20 hover:bg-primary/5"
                      >
                        <p className="font-medium text-foreground">{client.full_name}</p>
                        {client.email ? <p className="mt-1 text-xs text-muted-foreground">{client.email}</p> : null}
                      </Link>
                    )) : <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sin clientes que coincidan.</p>}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rutinas</p>
                    {filteredRoutines.length > 0 ? filteredRoutines.map((routine) => (
                      <Link
                        key={routine.id}
                        href={`/dashboard/clients/${routine.client_id}/routines/${routine.id}`}
                        className="block rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm transition hover:border-primary/20 hover:bg-primary/5"
                      >
                        <p className="font-medium text-foreground">{routine.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{routine.clientName}</p>
                      </Link>
                    )) : <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sin rutinas que coincidan.</p>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active ? 'border border-primary/20 bg-primary/10 text-primary' : 'border border-transparent bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <ThemeToggle />
        </div>

        <div className="ml-auto flex max-w-full shrink-0 items-center gap-2">
          <ThemeToggle className="lg:hidden" />
          <TrainerDrawerWrapper
            email={email}
            trainerName={trainerName}
            trainerId={trainerId}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  )
}
