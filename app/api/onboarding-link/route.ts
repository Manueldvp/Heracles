// app/api/onboarding-link/route.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST — vincular user al cliente por token (NO marca onboarding_completed)
export async function POST(req: Request) {
  try {
    const { token, userId, email } = await req.json()

    if (!token || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Buscar cliente por token
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, form_id, onboarding_completed, user_id, status, invite_token_expires_at')
      .eq('invite_token', token)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    // Si ya completó el onboarding
    if (client.onboarding_completed) {
      return NextResponse.json({ redirect: '/client' }, { status: 409 })
    }

    // Token expirado
    if (client.invite_token_expires_at && new Date(client.invite_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 410 })
    }

    // Vincular user_id — solo actualiza user_id y status, NO onboarding_completed
    if (!client.user_id) {
      await supabaseAdmin.from('clients').update({
        user_id: userId,
        email: email,
        status: 'active',
        // onboarding_completed se mantiene en false hasta que llene el formulario
      }).eq('id', client.id)
    }

    return NextResponse.json({
      clientId: client.id,
      formId: client.form_id,
      onboardingCompleted: client.onboarding_completed,
    })

  } catch (e: any) {
    console.error('onboarding-link POST error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — marcar onboarding completo (llamado solo al enviar el formulario)
export async function PATCH(req: Request) {
  try {
    const { clientId, updates } = await req.json()

    await supabaseAdmin.from('clients').update({
      onboarding_completed: true,
      status: 'active',
      ...updates, // datos del formulario: full_name, weight, height, age, goal, etc.
    }).eq('id', clientId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}