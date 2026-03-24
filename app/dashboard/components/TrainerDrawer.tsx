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
        className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition"
      >
        <Bell size={16} className="text-zinc-400" />
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
          <button className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center hover:bg-orange-500/30 transition overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-orange-400 font-bold text-sm">{initial}</span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="bg-zinc-950 border-zinc-800 w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

          {/* Perfil */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-orange-400 font-bold text-xl">{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{trainerName}</p>
                <p className="text-zinc-500 text-xs truncate">{email}</p>
                <p className="text-orange-400 text-xs mt-0.5">Entrenador</p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNotifs(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${!showNotifs ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Menú
              </button>
              <button
                onClick={() => void openNotifications()}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition relative ${showNotifs ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      active
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </Link>
                )
              })}
            </nav>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <p className="text-zinc-400 text-xs">{notifications.length} notificaciones</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-orange-400 text-xs hover:text-orange-300 transition">
                    <CheckCheck size={13} /> Marcar todo leído
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                    <Bell size={32} className="text-zinc-700" />
                    <p className="text-zinc-600 text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-900 transition border-b border-zinc-800/30 ${!notif.read ? 'bg-orange-500/5' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!notif.read ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
                          <span className="text-sm">💪</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!notif.read ? 'text-white' : 'text-zinc-400'}`}>{notif.message}</p>
                          <p className="text-zinc-600 text-xs mt-1">{formatNotificationTime(notif.created_at)}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {!showNotifs && (
            <div className="p-4 border-t border-zinc-800">
              <p className="text-zinc-600 text-xs text-center mb-3">Treinex © 2026</p>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition w-full"
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
