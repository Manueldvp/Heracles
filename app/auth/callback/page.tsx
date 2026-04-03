'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageLoader from '@/components/ui/page-loader'
import { persistInviteToken, resolveAuthenticatedPath } from '@/lib/auth/client-routing'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const finishAuth = async () => {
      const inviteToken = searchParams.get('token')
      const redirectPath = searchParams.get('redirect')
      const code = searchParams.get('code')
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      persistInviteToken(inviteToken)

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message)
          return
        }
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (sessionError) {
          if (!cancelled) setError(sessionError.message)
          return
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) router.replace(inviteToken ? `/login?token=${encodeURIComponent(inviteToken)}` : '/login')
        return
      }

      const target = await resolveAuthenticatedPath(supabase, {
        userId: user.id,
        inviteToken,
        redirectPath,
      })

      if (!cancelled) {
        if (target.error) setError(target.error)
        router.replace(target.path)
      }
    }

    void finishAuth()

    return () => {
      cancelled = true
    }
  }, [router, searchParams, supabase])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-sm text-red-400">
        {error}
      </div>
    )
  }

  return <PageLoader className="min-h-screen bg-background" compact />
}
