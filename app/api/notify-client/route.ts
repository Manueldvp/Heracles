import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { APP_URL, EMAIL_FROM } from '@/lib/branding'
import { buildAssignedContentEmail } from '@/lib/email/templates'

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
          routine_assigned: 'Rutina nueva',
          nutrition_assigned: 'Plan nutricional nuevo',
          message: 'Nuevo mensaje',
        }
        const subjectPrefix = iconMap[type] ?? 'Actualización'

        await resend.emails.send({
          from: EMAIL_FROM,
          to: clientEmail,
          subject: `${subjectPrefix} en ${appName}`,
          html: buildAssignedContentEmail({
            appName,
            clientName,
            trainerName,
            message,
            ctaLabel: 'Ver actualización',
            href: `${APP_URL}/client`,
          })
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('notify-client error:', error)
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 })
  }
}
