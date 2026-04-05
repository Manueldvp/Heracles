'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Search, Sparkles, Zap } from 'lucide-react'
import TrainerDrawerWrapper from './TrainerDrawerWrapper'
import ThemeToggle from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'

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
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const searchAnchorRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const searchPanelRef = useRef<HTMLDivElement | null>(null)
  const normalizedSearch = search.trim().toLowerCase()
  const shouldShowResults = normalizedSearch.length >= 3

  const closeSearch = useCallback(() => {
    setOpen(false)
    searchInputRef.current?.blur()
  }, [])

  const filteredClients = useMemo(() => {
    if (!shouldShowResults) return []
    return searchClients
      .filter((client) =>
        [client.full_name, client.email]
          .filter(Boolean)
          .some((value) => {
            const normalizedValue = value!.toLowerCase().trim()
            const words = normalizedValue.split(/\s+/).filter(Boolean)

            return normalizedValue.startsWith(normalizedSearch)
              || words.some((word) => word.startsWith(normalizedSearch))
          })
      )
      .slice(0, 4)
  }, [normalizedSearch, searchClients, shouldShowResults])

  const filteredRoutines = useMemo(() => {
    if (!shouldShowResults) return []
    return searchRoutines
      .filter((routine) =>
        [routine.title, routine.clientName].some((value) => {
          const normalizedValue = value.toLowerCase().trim()
          const words = normalizedValue.split(/\s+/).filter(Boolean)

          return normalizedValue.startsWith(normalizedSearch)
            || words.some((word) => word.startsWith(normalizedSearch))
        })
      )
      .slice(0, 4)
  }, [normalizedSearch, searchRoutines, shouldShowResults])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSearch()
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null

      if (!target) return
      if (searchInputRef.current?.contains(target)) return
      if (searchPanelRef.current?.contains(target)) return

      closeSearch()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [closeSearch, open])

  return (
    <header className="sticky top-0 z-30 max-w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="flex h-20 max-w-full items-center gap-3 overflow-x-hidden px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(249,115,22,0.22)]">
              <Zap className="h-4 w-4" />
            </div>
            <p className="truncate text-lg font-semibold tracking-[0.18em] text-foreground">TREINEX</p>
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4">
          <Link href="/dashboard" className="mr-1 flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(249,115,22,0.22)] transition-transform duration-200 hover:-translate-y-0.5">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-[0.18em] text-foreground">TREINEX</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Coach Console</p>
            </div>
          </Link>

          <div ref={searchAnchorRef} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => {
                const nextValue = event.target.value
                setSearch(nextValue)
                setOpen(nextValue.trim().length >= 3)
              }}
              type="text"
              placeholder="Buscar clientes o rutinas..."
              className="h-12 w-full rounded-2xl border border-border bg-card/90 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/12"
            />
          </div>

          <nav className="flex items-center gap-1 rounded-full bg-muted/70 p-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-card text-foreground shadow-sm' : 'border border-transparent bg-transparent text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="ml-auto flex max-w-full shrink-0 items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="rounded-full px-3 sm:px-4">
            <Link href="/dashboard/billing">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Upgrade</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle className="hidden lg:inline-flex" />
          <ThemeToggle className="lg:hidden" />
          <TrainerDrawerWrapper
            email={email}
            trainerName={trainerName}
            trainerId={trainerId}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar búsqueda"
              className="fixed inset-0 z-40 bg-background/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={closeSearch}
            />
            <motion.div
              ref={searchPanelRef}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed z-50 rounded-[28px] border border-border bg-card/98 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
              style={searchAnchorRef.current
                ? {
                    top: searchAnchorRef.current.getBoundingClientRect().bottom + 12,
                    left: searchAnchorRef.current.getBoundingClientRect().left,
                    width: searchAnchorRef.current.getBoundingClientRect().width,
                  }
                : undefined}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clientes</p>
                  {filteredClients.length > 0 ? filteredClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      onClick={closeSearch}
                      className="block rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-primary/20 hover:bg-primary/5"
                    >
                      <p className="font-medium text-foreground">{client.full_name}</p>
                      {client.email ? <p className="mt-1 text-xs text-muted-foreground">{client.email}</p> : null}
                    </Link>
                  )) : <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Sin clientes que coincidan.</p>}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rutinas</p>
                  {filteredRoutines.length > 0 ? filteredRoutines.map((routine) => (
                    <Link
                      key={routine.id}
                      href={`/dashboard/clients/${routine.client_id}/routines/${routine.id}`}
                      onClick={closeSearch}
                      className="block rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-primary/20 hover:bg-primary/5"
                    >
                      <p className="font-medium text-foreground">{routine.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{routine.clientName}</p>
                    </Link>
                  )) : <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Sin rutinas que coincidan.</p>}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
