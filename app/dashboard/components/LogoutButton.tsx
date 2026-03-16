'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-zinc-800 transition text-zinc-500 hover:text-red-400 w-full"
    >
      <LogOut size={18} />
      Cerrar sesión
    </button>
  )
}