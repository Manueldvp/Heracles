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
  { href: '/dashboard', label: 'Performance' },
  { href: '/dashboard/clients', label: 'Clients' },
  { href: '/dashboard/forms', label: 'Plans' },
]

export default function DashboardTopbar({ email, trainerName, trainerId, avatarUrl = '' }: Props) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0b1120]/90 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className="text-lg font-semibold tracking-[-0.04em] text-orange-200">Treinex</p>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search athletes, routines, or metrics..."
              className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#131b2f] pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-orange-500/50"
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
                    active ? 'bg-white/7 text-orange-200' : 'text-zinc-400 hover:text-white'
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
