'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TrainerDrawer from './TrainerDrawer'

interface Props {
  email: string
  trainerName: string
  trainerId: string
  avatarUrl?: string
}

export default function TrainerDrawerWrapper({ email, trainerName, trainerId, avatarUrl = '' }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <TrainerDrawer
      email={email}
      trainerName={trainerName}
      trainerId={trainerId}
      onLogout={handleLogout}
      avatarUrl={avatarUrl}
    />
  )
}
