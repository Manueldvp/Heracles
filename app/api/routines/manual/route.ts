import { updateOnboardingProgress } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, title, content } = await request.json()
  if (!clientId || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('trainer_id', user.id)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({
      client_id: clientId,
      trainer_id: user.id,
      title,
      content,
    })
    .select('id, title')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await updateOnboardingProgress(supabase, user.id, { created_routine: true })

  return NextResponse.json({ routine })
}
