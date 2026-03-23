import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrainerDrawerWrapper from './components/TrainerDrawerWrapper'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'client') redirect('/client')

  const { data: unreadNotifs } = await supabase
    .from('notifications')
    .select('id')
    .eq('trainer_id', user.id)
    .eq('read', false)

  const unreadCount = unreadNotifs?.length ?? 0

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
      `}</style>

      <header className="border-b border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>

        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-display text-xl text-white tracking-widest">HERACLES</span>
        </Link>

        <TrainerDrawerWrapper
          email={user.email ?? ''}
          trainerName={profile?.full_name ?? 'Entrenador'}
          avatarUrl={profile?.avatar_url ?? ''}
          unreadCount={unreadCount}
        />
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
