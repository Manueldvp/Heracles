import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientName, trainerId, checkinType } = await req.json()

    // Guardar notificación en DB
    await supabaseAdmin.from('notifications').insert({
      trainer_id: trainerId,
      client_id: clientId,
      type: 'checkin',
      message: `${clientName} completó su check-in ${checkinType === 'daily' ? 'diario' : 'semanal'}`,
    })

    // Obtener datos del entrenador
    const { data: trainer } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', trainerId)
      .single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(trainerId)
    const trainerEmail = authUser?.user?.email

    if (trainerEmail) {
      await resend.emails.send({
        from: 'Heracles <onboarding@resend.dev>',
        to: trainerEmail,
        subject: `💪 ${clientName} completó su check-in`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <div style="width: 40px; height: 40px; background: #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">⚡</div>
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">HERACLES</span>
            </div>
            <h2 style="color: #f97316; margin: 0 0 8px;">Nuevo check-in recibido</h2>
            <p style="color: #a1a1aa; margin: 0 0 24px;">
              Hola ${trainer?.full_name?.split(' ')[0] ?? 'Entrenador'}, tu cliente <strong style="color: #fff">${clientName}</strong> acaba de completar su check-in ${checkinType === 'daily' ? 'diario' : 'semanal'}.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
              style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Ver check-in →
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