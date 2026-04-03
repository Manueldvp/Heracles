import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientDrawerWrapper from './components/LogoutAction'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'
import AICharacter from '@/components/ai/AICharacter'
import { extractAssistantConfig } from '@/lib/ai-assistant'
import { validateConnection } from '@/lib/ai/validateConnection'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: clientData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('clients').select('id, full_name, trainer_id, avatar_url').eq('user_id', user.id).maybeSingle(),
  ])

  if (profile?.role === 'trainer') redirect('/dashboard')

  // Fallback para cuentas antiguas sin role en profiles.
  if (!clientData) redirect('/login')

  const { data: trainerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientData.trainer_id)
    .single()

  const assistantConfig = extractAssistantConfig(trainerProfile)
  const hasValidAIConnection = await validateConnection(user.id)
  const appName = assistantConfig.assistantName

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
      `}</style>

      <header className="sticky top-0 z-10 flex h-14 max-w-full items-center justify-between overflow-x-hidden border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <Link href="/client" className="group flex min-w-0 items-center gap-2">
          <Zap size={16} className="shrink-0 text-primary transition group-hover:text-primary-hover" />
          <span className="truncate font-display text-xl text-foreground tracking-widest">{appName.toUpperCase()}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <ClientDrawerWrapper
            email={user.email ?? ''}
            clientName={clientData.full_name ?? ''}
            clientId={clientData.id}
            avatarUrl={clientData.avatar_url ?? ''}
            appName={appName}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 flex-1">
        {children}
      </main>
      <AICharacter
        assistantName={assistantConfig.assistantName}
        personality={assistantConfig.personality}
        canAsk
        connectionValid={hasValidAIConnection}
        characterPreference={profile?.assistant_character === 'female' ? 'female' : 'male'}
      />
    </div>
  )
}
