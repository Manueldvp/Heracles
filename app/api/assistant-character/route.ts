import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { character } = await request.json()

  if (character !== 'male' && character !== 'female') {
    return NextResponse.json({ error: 'Invalid character' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ assistant_character: character })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, character })
}
