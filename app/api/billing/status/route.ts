import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrainerBillingStatus } from '@/lib/billing'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const status = await getTrainerBillingStatus(supabase, user.id)
    return NextResponse.json({ status })
  } catch (error) {
    console.error('billing status error:', error)
    return NextResponse.json({ error: 'No se pudo cargar el estado de la cuenta' }, { status: 500 })
  }
}
