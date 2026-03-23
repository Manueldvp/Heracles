import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Falta token' }, { status: 400 })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, email, form_id, onboarding_completed, user_id, status, invite_token_expires_at')
      .eq('invite_token', token)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    if (client.invite_token_expires_at && new Date(client.invite_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 410 })
    }

    if (client.user_id && client.user_id !== user.id) {
      return NextResponse.json({ error: 'Esta invitación ya está asociada a otra cuenta' }, { status: 409 })
    }

    if (client.email && user.email && client.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Debes iniciar sesión con el correo invitado' }, { status: 403 })
    }

    if (!client.user_id) {
      await supabaseAdmin
        .from('clients')
        .update({
          user_id: user.id,
          email: user.email,
          status: 'active',
        })
        .eq('id', client.id)
    }

    await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, role: 'client' }, { onConflict: 'id' })

    if (client.onboarding_completed) {
      return NextResponse.json({ redirect: '/client' }, { status: 409 })
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

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { clientId, updates } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'Falta clientId' }, { status: 400 })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, user_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    if (client.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const safeUpdates: Record<string, any> = {}
    if (updates && typeof updates === 'object') {
      const allowed = ['full_name', 'weight', 'height', 'age', 'goal', 'level', 'restrictions']
      for (const key of allowed) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key]
      }
    }

    await supabaseAdmin
      .from('clients')
      .update({
        onboarding_completed: true,
        status: 'active',
        ...safeUpdates,
      })
      .eq('id', clientId)

    if (safeUpdates.full_name) {
      await supabaseAdmin
        .from('profiles')
        .upsert({ id: user.id, full_name: safeUpdates.full_name, role: 'client' }, { onConflict: 'id' })
    } else {
      await supabaseAdmin
        .from('profiles')
        .upsert({ id: user.id, role: 'client' }, { onConflict: 'id' })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
