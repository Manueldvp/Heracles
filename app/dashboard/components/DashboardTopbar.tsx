'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import TrainerDrawerWrapper from './TrainerDrawerWrapper'

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
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className="text-lg font-semibold tracking-[-0.04em] text-orange-600">Treinex</p>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar clientes, rutinas o métricas..."
              className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-100"
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
                    active ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="ml-auto">
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
