import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ALLOWED_TYPES = new Set(['routine_assigned', 'nutrition_assigned', 'message'])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { clientId, type, message } = await req.json()

    if (!clientId || !type || !message) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const [{ data: trainerProfile }, { data: client }] = await Promise.all([
      supabaseAdmin.from('profiles').select('role, full_name, ai_trainer_name').eq('id', user.id).single(),
      supabaseAdmin.from('clients').select('id, trainer_id, user_id, full_name').eq('id', clientId).single(),
    ])

    if (!trainerProfile || trainerProfile.role !== 'trainer') {
      return NextResponse.json({ error: 'Solo entrenadores pueden enviar notificaciones' }, { status: 403 })
    }

    if (!client || client.trainer_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para este cliente' }, { status: 403 })
    }

    await supabaseAdmin.from('notifications').insert({
      trainer_id: user.id,
      client_id: client.id,
      type,
      message,
      target_role: 'client',
    })

    if (client.user_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(client.user_id)
      const clientEmail = authUser?.user?.email

      const appName = trainerProfile.ai_trainer_name || 'Heracles'
      const trainerName = trainerProfile.full_name?.split(' ')[0] ?? 'Tu entrenador'
      const clientName = client.full_name ?? 'Cliente'

      if (clientEmail) {
        const iconMap: Record<string, string> = {
          routine_assigned: '???',
          nutrition_assigned: '??',
          message: '??',
        }
        const icon = iconMap[type] ?? '?'

        await resend.emails.send({
          from: `${appName} <onboarding@resend.dev>`,
          to: clientEmail,
          subject: `${icon} ${message}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; color: #fff; padding: 32px; border-radius: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <div style="width: 40px; height: 40px; background: #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">?</div>
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${appName.toUpperCase()}</span>
              </div>
              <h2 style="color: #f97316; margin: 0 0 8px;">${message}</h2>
              <p style="color: #a1a1aa; margin: 0 0 24px;">
                Hola <strong style="color: #fff">${clientName}</strong>, ${trainerName} te ha asignado contenido nuevo. Entra a la app para verlo.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/client"
                style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Ver ahora ?
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
