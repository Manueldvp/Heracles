import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientName, trainerId, type, message } = await req.json()

    // Guardar notificación para el cliente
    await supabaseAdmin.from('notifications').insert({
      trainer_id: trainerId,
      client_id: clientId,
      type,
      message,
      target_role: 'client',
    })

    // Obtener user_id del cliente
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', clientId)
      .single()

    if (client?.user_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(client.user_id)
      const clientEmail = authUser?.user?.email

      const { data: trainerProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, ai_trainer_name')
        .eq('id', trainerId)
        .single()

      const appName = trainerProfile?.ai_trainer_name || 'Heracles'
      const trainerName = trainerProfile?.full_name?.split(' ')[0] ?? 'Tu entrenador'

      if (clientEmail) {
        const iconMap: Record<string, string> = {
          routine_assigned: '🏋️',
          nutrition_assigned: '🥗',
          message: '💬',
        }
        const icon = iconMap[type] ?? '⚡'

        await resend.emails.send({
          from: `${appName} <onboarding@resend.dev>`,
          to: clientEmail,
          subject: `${icon} ${message}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <div style="width: 40px; height: 40px; background: #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">⚡</div>
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${appName.toUpperCase()}</span>
              </div>
              <h2 style="color: #f97316; margin: 0 0 8px;">${message}</h2>
              <p style="color: #a1a1aa; margin: 0 0 24px;">
                Hola <strong style="color: #fff">${clientName}</strong>, ${trainerName} te ha asignado contenido nuevo. Entra a la app para verlo.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/client"
                style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Ver ahora →
              </a>
              <p style="color: #3f3f46; font-size: 12px; margin-top: 32px;">© 2026 ${appName}</p>
            </div>
          `
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('notify-client error:', error)
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 })
  }
}