import type { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

const PENDING_INVITE_TOKEN_KEY = 'pending_invite_token'

type BrowserSupabase = ReturnType<typeof createBrowserSupabaseClient>

type ProfileRow = {
  role?: string | null
}

type ClientRow = {
  id: string
  onboarding_completed?: boolean | null
  invite_token?: string | null
}

export function persistInviteToken(token?: string | null) {
  if (typeof window === 'undefined') return
  if (!token) return
  window.localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token)
}

export function readPendingInviteToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(PENDING_INVITE_TOKEN_KEY)
}

export function clearPendingInviteToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PENDING_INVITE_TOKEN_KEY)
}

async function acceptInviteIfNeeded(supabase: BrowserSupabase, inviteToken?: string | null) {
  if (!inviteToken) return { accepted: false, error: null as string | null }

  const { error } = await supabase.rpc('accept_invite', { token: inviteToken })
  if (error) {
    return { accepted: false, error: error.message ?? 'No fue posible aceptar la invitación' }
  }

  return { accepted: true, error: null as string | null }
}

async function recoverPendingInviteToken() {
  const response = await fetch('/api/invite/recover', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) return null

  const payload = await response.json().catch(() => ({ token: null }))
  return typeof payload.token === 'string' && payload.token ? payload.token : null
}

export async function resolveAuthenticatedPath(
  supabase: BrowserSupabase,
  {
    userId,
    inviteToken,
    redirectPath,
  }: {
    userId: string
    inviteToken?: string | null
    redirectPath?: string | null
  }
) {
  const safeRedirect = redirectPath && redirectPath.startsWith('/') ? redirectPath : null
  let pendingInviteToken = inviteToken || readPendingInviteToken()

  const [{ data: profile }, { data: existingClientRow }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from('clients')
      .select('id, onboarding_completed, invite_token')
      .eq('user_id', userId)
      .maybeSingle<ClientRow>(),
  ])

  let clientRow = existingClientRow

  if (!clientRow && pendingInviteToken) {
    const inviteResult = await acceptInviteIfNeeded(supabase, pendingInviteToken)
    if (inviteResult.error) {
      return { path: `/login?token=${encodeURIComponent(pendingInviteToken)}`, error: inviteResult.error }
    }

    persistInviteToken(pendingInviteToken)

    const { data: linkedClientRow } = await supabase
      .from('clients')
      .select('id, onboarding_completed, invite_token')
      .eq('user_id', userId)
      .maybeSingle<ClientRow>()

    clientRow = linkedClientRow
  }

  if (!clientRow && !pendingInviteToken) {
    pendingInviteToken = await recoverPendingInviteToken()

    if (pendingInviteToken) {
      persistInviteToken(pendingInviteToken)

      const inviteResult = await acceptInviteIfNeeded(supabase, pendingInviteToken)
      if (inviteResult.error) {
        return { path: `/login?token=${encodeURIComponent(pendingInviteToken)}`, error: inviteResult.error }
      }

      const { data: linkedClientRow } = await supabase
        .from('clients')
        .select('id, onboarding_completed, invite_token')
        .eq('user_id', userId)
        .maybeSingle<ClientRow>()

      clientRow = linkedClientRow
    }
  }

  if (clientRow) {
    const onboardingToken = pendingInviteToken || clientRow.invite_token || null
    if (onboardingToken && clientRow.onboarding_completed === false) {
      return { path: `/onboarding/${onboardingToken}`, error: null }
    }

    clearPendingInviteToken()
    return { path: safeRedirect || '/client', error: null }
  }

  if (profile?.role === 'trainer') {
    return { path: safeRedirect || '/dashboard', error: null }
  }

  if (pendingInviteToken) {
    return { path: `/onboarding/${pendingInviteToken}`, error: null }
  }

  return { path: safeRedirect || '/login', error: null }
}
