import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { clientId, checkinType } = await req.json()

    if (!clientId || !checkinType) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (checkinType !== 'daily' && checkinType !== 'weekly') {
      return NextResponse.json({ error: 'Tipo de check-in inválido' }, { status: 400 })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, trainer_id, full_name')
      .eq('id', clientId)
      .single()

    if (!client || client.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este check-in' }, { status: 403 })
    }

    const clientName = client.full_name ?? 'Tu cliente'

    await supabaseAdmin.from('notifications').insert({
      trainer_id: client.trainer_id,
      client_id: client.id,
      type: 'checkin',
      message: `${clientName} completó su check-in ${checkinType === 'daily' ? 'diario' : 'semanal'}`,
      target_role: 'trainer',
    })

    const [{ data: trainer }, { data: authUser }] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name').eq('id', client.trainer_id).single(),
      supabaseAdmin.auth.admin.getUserById(client.trainer_id),
    ])

    const trainerEmail = authUser?.user?.email

    if (trainerEmail) {
      await resend.emails.send({
        from: 'Heracles <onboarding@resend.dev>',
        to: trainerEmail,
        subject: `?? ${clientName} completó su check-in`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <div style="width: 40px; height: 40px; background: #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">?</div>
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">HERACLES</span>
            </div>
            <h2 style="color: #f97316; margin: 0 0 8px;">Nuevo check-in recibido</h2>
            <p style="color: #a1a1aa; margin: 0 0 24px;">
              Hola ${trainer?.full_name?.split(' ')[0] ?? 'Entrenador'}, tu cliente <strong style="color: #fff">${clientName}</strong> acaba de completar su check-in ${checkinType === 'daily' ? 'diario' : 'semanal'}.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
              style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Ver check-in ?
            </a>
            <p style="color: #3f3f46; font-size: 12px; margin-top: 32px;">© 2026 Heracles</p>
          </div>
        `
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('notify-checkin error:', error)
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 })
  }
}
