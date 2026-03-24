import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { APP_URL, EMAIL_FROM } from '@/lib/branding'
import { buildCheckinEmail } from '@/lib/email/templates'

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
      const trainerName = trainer?.full_name?.split(' ')[0] ?? 'Entrenador'
      const checkinLabel = checkinType === 'daily' ? 'check-in diario' : 'check-in semanal'

      await resend.emails.send({
        from: EMAIL_FROM,
        to: trainerEmail,
        subject: `${clientName} completó su ${checkinLabel}`,
        html: buildCheckinEmail({
          clientName,
          trainerName,
          checkinLabel,
          href: `${APP_URL}/dashboard`,
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('notify-checkin error:', error)
    return NextResponse.json({ error: 'Error enviando notificación' }, { status: 500 })
  }
}
