'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ClientDrawer from './ClientDrawer'

interface Props {
  email: string
  clientName: string
  avatarUrl?: string
  appName: string
}

export default function ClientDrawerWrapper({ email, clientName, avatarUrl = '', appName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <ClientDrawer
      email={email}
      clientName={clientName}
      avatarUrl={avatarUrl}
      appName={appName}
      onLogout={handleLogout}
    />
  )
}