import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientDrawerWrapper from './components/LogoutAction'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'
import AICharacter from '@/components/ai/AICharacter'
import { extractAssistantConfig } from '@/lib/ai-assistant'
import { validateConnection } from '@/lib/ai/validateConnection'
import PageTransition from '@/components/ui/page-transition'

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
  const appName = 'Treinex'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
      `}</style>

      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/client" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(249,115,22,0.22)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <Zap size={16} className="shrink-0" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-xl tracking-[0.18em] text-foreground">{appName.toUpperCase()}</span>
              <span className="block truncate text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Fitness OS</span>
            </div>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <PageTransition>{children}</PageTransition>
      </main>
      <AICharacter
        assistantName={assistantConfig.assistantName}
        userId={user.id}
        personality={assistantConfig.personality}
        canAsk
        connectionValid={hasValidAIConnection}
        characterPreference={profile?.assistant_character === 'female' ? 'female' : 'male'}
      />
    </div>
  )
}
