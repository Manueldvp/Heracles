'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
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

  // Guardar el tipo antes de redirigir
  if (type === 'invite' || type === 'recovery') {
        sessionStorage.setItem('auth_type', type)
        router.push('/client/setup')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .single()

      if (profile?.role === 'client') {
        router.push('/client')
      } else {
        router.push('/dashboard')
      }
      return
    }

      // Sin token, verificar sesión existente
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        router.push(profile?.role === 'client' ? '/client' : '/dashboard')
      } else {
        router.push('/login')
      }
    }

    handleRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Cargando...</p>
    </div>
  )
}