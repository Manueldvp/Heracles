'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  trainer_id?: string | null
  client_id?: string | null
  message: string
  read: boolean
  created_at: string
  type: string
  target_role?: string | null
}

type Options = {
  trainerId?: string | null
  clientId?: string | null
  targetRole?: 'trainer' | 'client'
  limit?: number
}

export function useRealtimeNotifications({
  trainerId,
  clientId,
  targetRole,
  limit = 20,
}: Options) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const isRelevant = useCallback((notification?: Partial<AppNotification> | null) => {
    if (!notification) return false
    if (targetRole && notification.target_role !== targetRole) return false
    if (trainerId && notification.trainer_id !== trainerId) return false
    if (clientId && notification.client_id !== clientId) return false
    return true
  }, [clientId, targetRole, trainerId])

  const fetchNotifications = useCallback(async () => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (targetRole) query = query.eq('target_role', targetRole)
    if (trainerId) query = query.eq('trainer_id', trainerId)
    if (clientId) query = query.eq('client_id', clientId)

    const { data } = await query
    setNotifications(data ?? [])
  }, [clientId, limit, supabase, targetRole, trainerId])

  const markIdsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(notification => (
      ids.includes(notification.id) ? { ...notification, read: true } : notification
    )))
  }, [supabase])

  const markAllRead = useCallback(async () => {
    const ids = notifications.filter(notification => !notification.read).map(notification => notification.id)
    await markIdsRead(ids)
  }, [markIdsRead, notifications])

  const markRead = useCallback(async (id: string) => {
    await markIdsRead([id])
  }, [markIdsRead])

  const removeNotification = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    const loadInitialNotifications = async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (targetRole) query = query.eq('target_role', targetRole)
      if (trainerId) query = query.eq('trainer_id', trainerId)
      if (clientId) query = query.eq('client_id', clientId)

      const { data } = await query
      if (!cancelled) {
        setNotifications(data ?? [])
      }
    }

    const initialLoad = window.setTimeout(() => {
      void loadInitialNotifications()
    }, 0)

    const channel = supabase
      .channel(`notifications:${targetRole ?? 'all'}:${trainerId ?? 'none'}:${clientId ?? 'none'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        if (payload.eventType === 'INSERT') {
          const notification = payload.new as AppNotification
          if (!isRelevant(notification)) return
          setNotifications(prev => {
            const next = [notification, ...prev.filter(item => item.id !== notification.id)]
            return next.slice(0, limit)
          })
          return
        }

        if (payload.eventType === 'UPDATE') {
          const notification = payload.new as AppNotification
          if (!isRelevant(notification)) {
            setNotifications(prev => prev.filter(item => item.id !== notification.id))
            return
          }
          setNotifications(prev => prev.map(item => item.id === notification.id ? notification : item))
          return
        }

        if (payload.eventType === 'DELETE') {
          const notification = payload.old as AppNotification
          if (!isRelevant(notification)) return
          setNotifications(prev => prev.filter(item => item.id !== notification.id))
        }
      })
      .subscribe()

    return () => {
      cancelled = true
      window.clearTimeout(initialLoad)
      supabase.removeChannel(channel)
    }
  }, [clientId, fetchNotifications, isRelevant, limit, supabase, targetRole, trainerId])

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  )

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllRead,
    markRead,
    removeNotification,
  }
}
