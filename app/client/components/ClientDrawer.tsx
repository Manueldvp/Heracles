'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Home, Dumbbell, Salad, ClipboardList, LogOut, Camera, User, Bell, CheckCheck, X, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { useRealtimeNotifications } from '@/lib/notifications/useRealtimeNotifications'

interface Props {
  email: string
  clientName: string
  clientId: string
  avatarUrl?: string
  appName: string
  onLogout: () => void
}

const navItems = [
  { href: '/client',           label: 'Inicio',       icon: Home,         exact: true  },
  { href: '/client/routine',   label: 'Mi rutina',    icon: Dumbbell,     exact: false },
  { href: '/client/nutrition', label: 'Mi nutrición', icon: Salad,        exact: false },
  { href: '/client/progress',  label: 'Mi progreso',  icon: BarChart2,    exact: false },
  { href: '/client/checkin',   label: 'Check-in',     icon: ClipboardList,exact: true  },
  { href: '/client/profile',   label: 'Mi perfil',    icon: User,         exact: true  },
]

const typeIcon: Record<string, string> = {
  routine_assigned: '🏋️',
  nutrition_assigned: '🥗',
  message: '💬',
  checkin: '✅',
}

export default function ClientDrawer({ email, clientName, clientId, avatarUrl: initialAvatar = '', appName, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const supabase = createClient()
  const initial = clientName?.charAt(0).toUpperCase() ?? '?'
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    removeNotification,
  } = useRealtimeNotifications({
    clientId,
    targetRole: 'client',
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'heracles/avatars')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      const url = data.secure_url
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase.from('clients').update({ avatar_url: url }).eq('user_id', user.id)
        if (!error) {
          setAvatar(url)
          window.location.reload()
        }
      }
    } catch {
      alert('Error subiendo imagen')
    }
    setUploadingAvatar(false)
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

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
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
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
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
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-orange-400 font-bold text-xl">{initial}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition shadow-lg"
                >
                  {uploadingAvatar
                    ? <div className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <Camera size={10} className="text-white" />
                  }
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{clientName}</p>
                <p className="text-zinc-500 text-xs truncate">{email}</p>
                <p className="text-orange-400 text-xs mt-0.5">Cliente</p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 shrink-0">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {/* Nav pills */}
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
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-orange-400 text-xs hover:text-orange-300 transition"
                  >
                    <CheckCheck size={13} />
                    Marcar todo leído
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
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-zinc-800/30 ${!notif.read ? 'bg-orange-500/5' : ''}`}
                      >
                        <button
                          onClick={() => markRead(notif.id)}
                          className="flex items-start gap-3 flex-1 text-left"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!notif.read ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
                            <span className="text-sm">{typeIcon[notif.type] ?? '⚡'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${!notif.read ? 'text-white' : 'text-zinc-400'}`}>
                              {notif.message}
                            </p>
                            <p className="text-zinc-600 text-xs mt-1">{formatNotificationTime(notif.created_at)}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          <button
                            onClick={() => removeNotification(notif.id)}
                            className="text-zinc-700 hover:text-red-400 transition p-1"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {!showNotifs && (
            <div className="p-4 border-t border-zinc-800">
              <p className="text-zinc-600 text-xs text-center mb-3">Powered by {appName}</p>
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

