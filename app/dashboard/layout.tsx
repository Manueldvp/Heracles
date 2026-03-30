import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardTopbar from './components/DashboardTopbar'
import AICharacter from '@/components/ai/AICharacter'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url, ai_trainer_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'client') redirect('/client')

  const [{ data: clients }, { data: routines }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('routines')
      .select('id, client_id, title, content, clients(full_name)')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
        <DashboardTopbar
          email={user.email ?? ''}
          trainerName={profile?.full_name ?? 'Entrenador'}
          trainerId={user.id}
          avatarUrl={profile?.avatar_url ?? ''}
          searchClients={(clients ?? []).map((client) => ({
            id: client.id,
            full_name: client.full_name,
            email: client.email,
          }))}
          searchRoutines={(routines ?? []).map((routine) => ({
            id: routine.id,
            client_id: routine.client_id,
            title: ((routine.content as { title?: string } | null)?.title) ?? routine.title ?? 'Rutina',
            clientName: (routine.clients as { full_name?: string } | null)?.full_name ?? 'Cliente asignado',
          }))}
        />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <AICharacter assistantName={profile?.ai_trainer_name || 'Treinex'} />
      </div>
    </div>
  )
}
