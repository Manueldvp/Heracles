import { updateOnboardingProgress } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, templateId } = await request.json()
  if (!clientId || !templateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [{ data: client }, { data: template }] = await Promise.all([
    supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
      .maybeSingle(),
    supabase
      .from('routine_templates')
      .select('id, title, content')
      .eq('id', templateId)
      .eq('trainer_id', user.id)
      .maybeSingle(),
  ])

  if (!client || !template) {
    return NextResponse.json({ error: 'Template or client not found' }, { status: 404 })
  }

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({
      client_id: clientId,
      trainer_id: user.id,
      title: template.title,
      content: template.content,
      is_active: true,
    })
    .select('id, title')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await updateOnboardingProgress(supabase, user.id, {
    created_routine: true,
    assigned_routine: true,
  })

  return NextResponse.json({ routine })
}
