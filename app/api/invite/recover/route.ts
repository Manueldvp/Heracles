import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ token: null })
  }

  const { data: pendingInvite } = await supabaseAdmin
    .from('clients')
    .select('invite_token')
    .eq('email', user.email.toLowerCase())
    .eq('onboarding_completed', false)
    .not('invite_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ token: pendingInvite?.invite_token ?? null })
}
