import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateOnboardingProgress } from '@/lib/onboarding'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const progress = await updateOnboardingProgress(supabase, user.id, { completed: true })
    return NextResponse.json({ progress })
  } catch (error) {
    console.error('onboarding skip error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el onboarding' }, { status: 500 })
  }
}
