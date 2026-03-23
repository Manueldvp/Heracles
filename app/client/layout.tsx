import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientDrawerWrapper from './components/LogoutAction'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: clientData }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('clients').select('full_name, trainer_id, avatar_url').eq('user_id', user.id).maybeSingle(),
  ])

  if (profile?.role === 'trainer') redirect('/dashboard')

  // Fallback para cuentas antiguas sin role en profiles.
  if (!clientData) redirect('/login')

  const { data: trainerProfile } = await supabase
    .from('profiles')
    .select('ai_trainer_name')
    .eq('id', clientData.trainer_id)
    .single()

  const appName = trainerProfile?.ai_trainer_name || 'Heracles'

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
      `}</style>

      <header className="border-b border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
        <Link href="/client" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-display text-xl text-white tracking-widest">{appName.toUpperCase()}</span>
        </Link>
        <ClientDrawerWrapper
          email={user.email ?? ''}
          clientName={clientData.full_name ?? ''}
          avatarUrl={clientData.avatar_url ?? ''}
          appName={appName}
        />
      </header>

      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 flex-1">
        {children}
      </main>
    </div>
  )
}
