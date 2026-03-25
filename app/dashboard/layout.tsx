import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from './components/DashboardSidebar'
import DashboardTopbar from './components/DashboardTopbar'

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

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      <DashboardSidebar />
      <div className="lg:pl-72">
        <DashboardTopbar
          email={user.email ?? ''}
          trainerName={profile?.full_name ?? 'Entrenador'}
          trainerId={user.id}
          avatarUrl={profile?.avatar_url ?? ''}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
