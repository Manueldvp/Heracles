'use client'

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
}

const navItems = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/clients', label: 'Clientes' },
  { href: '/dashboard/forms', label: 'Formularios' },
]

export default function DashboardTopbar({ email, trainerName, trainerId, avatarUrl = '' }: Props) {
  const pathname = usePathname()

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
              type="text"
              placeholder="Buscar clientes, rutinas o métricas..."
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
