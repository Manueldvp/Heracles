import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EMAIL_FROM, APP_NAME } from '@/lib/branding'
import { buildInviteEmail } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { to, inviteUrl, hasForm } = await req.json()

    if (!to || !inviteUrl) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'trainer') {
      return NextResponse.json({ error: 'Solo entrenadores pueden enviar invitaciones' }, { status: 403 })
    }

    const trainerName = profile.full_name ?? 'Tu entrenador'

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `${trainerName} te invita a entrenar en ${APP_NAME}`,
      html: buildInviteEmail({ trainerName, inviteUrl, hasForm }),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: data?.id })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno'
    console.error('Send invite error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
