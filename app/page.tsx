'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LandingPage from '@/components/landing-page'
import { createTranslator } from '@/lib/i18n'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const t = createTranslator('es')

  useEffect(() => {
    const resolveRoleRedirect = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.role === 'client') return '/client'
      if (profile?.role === 'trainer') return '/dashboard'

      // Fallback para cuentas antiguas sin role.
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      return clientRow ? '/client' : '/dashboard'
    }

    const handleRedirect = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && refreshToken) {
        const { data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (type === 'invite' || type === 'recovery') {
          sessionStorage.setItem('auth_type', type)
          router.push('/client/setup')
          return
        }

        const target = await resolveRoleRedirect(data.user!.id)
        router.push(target)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const target = await resolveRoleRedirect(user.id)
        router.push(target)
      } else {
        setReady(true)
      }
    }

    handleRedirect()
  }, [router, supabase])

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500">{t('common.loading')}</p>
      </div>
    )
  }

  return <LandingPage />
}
