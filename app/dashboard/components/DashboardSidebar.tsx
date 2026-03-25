'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp, ClipboardList, Home, Settings, Users } from 'lucide-react'
import InviteClientDialog from '@/app/dashboard/clients/components/InviteClientDialog'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/forms', label: 'Check-ins', icon: ClipboardList },
]

const secondaryItems = [
  { href: '/dashboard/profile', label: 'Settings', icon: Settings },
  { href: '/dashboard/profile', label: 'Support', icon: CircleHelp },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:flex-col lg:border-r lg:border-zinc-800 lg:bg-[#0b1120]">
      <div className="border-b border-zinc-800 px-8 py-7">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-black shadow-[0_16px_40px_rgba(249,115,22,0.32)]">
            <span className="text-lg font-black">T</span>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-[-0.05em] text-orange-200">Treinex</p>
            <p className="mt-1 text-xs uppercase tracking-[0.28em] text-zinc-500">Kinetic Authority</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-white/7 text-orange-200 shadow-[inset_2px_0_0_0_#f97316]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-orange-300' : 'text-zinc-500 group-hover:text-zinc-200'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="px-4 pb-6">
        <div className="mb-5 rounded-3xl border border-orange-500/20 bg-orange-500/10 p-4">
          <InviteClientDialog />
        </div>

        <div className="space-y-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <item.icon className="h-5 w-5 text-zinc-500 group-hover:text-zinc-200" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
