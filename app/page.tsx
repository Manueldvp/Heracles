'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resolveAuthenticatedPath } from '@/lib/auth/client-routing'
import LandingPage from '@/components/landing-page'
import PageLoader from '@/components/ui/page-loader'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error || !data.user) {
          setReady(true)
          return
        }

        const target = await resolveAuthenticatedPath(supabase, { userId: data.user.id })
        router.push(target.path)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const target = await resolveAuthenticatedPath(supabase, { userId: user.id })
        router.push(target.path)
      } else {
        setReady(true)
      }
    }

    handleRedirect()
  }, [router, supabase])

  if (!ready) {
    return <PageLoader className="min-h-screen bg-background" compact />
  }

  return <LandingPage />
}
