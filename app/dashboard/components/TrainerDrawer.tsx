'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Home, Users, Settings, LogOut, Bell, CheckCheck, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRealtimeNotifications } from '@/lib/notifications/useRealtimeNotifications'

interface Props {
  email: string
  trainerName: string
  trainerId: string
  onLogout: () => void
  avatarUrl?: string
}

const navItems = [
  { href: '/dashboard',              label: 'Inicio',         icon: Home,     exact: true  },
  { href: '/dashboard/clients',      label: 'Clientes',       icon: Users,    exact: false },
  { href: '/dashboard/forms',        label: 'Formularios',    icon: FileText, exact: false },
  { href: '/dashboard/profile',      label: 'Mi perfil',      icon: Settings, exact: true  },
]

export default function TrainerDrawer({ email, trainerName, trainerId, onLogout, avatarUrl = '' }: Props) {
  const [open, setOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  } = useRealtimeNotifications({
    trainerId,
    targetRole: 'trainer',
  })
  const [showNotifs, setShowNotifs] = useState(false)
  const pathname = usePathname()
  const initial = trainerName?.charAt(0).toUpperCase() ?? '?'
  const menuTabClass = 'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition'
  const menuTabActive = 'border border-primary/20 bg-primary/10 text-primary'
  const menuTabInactive = 'bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'
  const navItemBase = 'flex items-center gap-3 rounded-xl border px-4 py-3 transition'
  const navItemActive = 'border-primary/20 bg-primary/10 text-primary'
  const navItemInactive = 'border-transparent bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground'

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const formatNotificationTime = (date: string) => {
    return new Date(date).toLocaleString('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const openNotifications = async () => {
    setOpen(true)
    setShowNotifs(true)
    await markAllRead()
  }

  return (
    <div className="flex items-center gap-2">

      {/* Bell */}
      <button
        onClick={() => void openNotifications()}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-transparent transition hover:bg-accent/70"
      >
        <Bell size={16} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={v => {
        setOpen(v)
        if (!v) setShowNotifs(false)
      }}>
        <SheetTrigger asChild>
          <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card transition hover:border-primary/50">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-orange-400 font-bold text-sm">{initial}</span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="flex w-72 flex-col border-border bg-background p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

          {/* Perfil */}
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xl">{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{trainerName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
                <p className="mt-0.5 text-xs text-primary">Entrenador</p>
              </div>
              {unreadCount > 0 && (
                <Badge className="shrink-0">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNotifs(false)}
                className={`${menuTabClass} ${!showNotifs ? menuTabActive : menuTabInactive}`}
              >
                Menú
              </button>
              <button
                onClick={() => void openNotifications()}
                className={`${menuTabClass} relative ${showNotifs ? menuTabActive : menuTabInactive}`}
              >
                Notificaciones
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {!showNotifs ? (
            <nav className="flex flex-col gap-1 p-4 flex-1">
              {navItems.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`${navItemBase} ${active ? navItemActive : navItemInactive}`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                )
              })}
            </nav>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">{notifications.length} notificaciones</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary transition hover:text-primary-hover">
                    <CheckCheck size={13} /> Marcar todo leído
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                    <Bell size={32} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`flex items-start gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-accent/50 ${!notif.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-transparent text-base">
                          <span className="text-sm">💪</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatNotificationTime(notif.created_at)}</p>
                        </div>
                        {!notif.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {!showNotifs && (
            <div className="border-t border-border p-4">
              <p className="mb-3 text-center text-xs text-muted-foreground">Treinex © 2026</p>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-400 transition hover:bg-red-400/10"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
