'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp, ClipboardList, Home, Settings, Users } from 'lucide-react'
import InviteClientDialog from '@/app/dashboard/clients/components/InviteClientDialog'
import BrandLockup from '@/components/brand-lockup'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: Home },
  { href: '/dashboard/clients', label: 'Clientes', icon: Users },
  { href: '/dashboard/forms', label: 'Formularios', icon: ClipboardList },
]

const secondaryItems = [
  { href: '/dashboard/profile', label: 'Configuración', icon: Settings },
  { href: '/dashboard/profile', label: 'Soporte', icon: CircleHelp },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const navLinkBase = 'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition'
  const navLinkInactive = 'bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'
  const navLinkActive = 'border border-primary/20 bg-primary/10 text-primary'

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-sidebar">
      <div className="border-b border-border px-8 py-7">
        <BrandLockup />
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${navLinkBase} ${active ? navLinkActive : navLinkInactive}`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="px-4 pb-6">
        <div className="mb-5 rounded-3xl border border-border bg-card p-4">
          <InviteClientDialog />
        </div>

        <div className="space-y-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${navLinkBase} ${navLinkInactive}`}
            >
              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
