import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { routineId, content } = await request.json()
  if (!routineId || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: routine } = await supabase
    .from('routines')
    .select('id')
    .eq('id', routineId)
    .eq('trainer_id', user.id)
    .maybeSingle()

  if (!routine) {
    return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('routines')
    .update({
      title: content.title ?? null,
      content,
    })
    .eq('id', routineId)
    .eq('trainer_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
