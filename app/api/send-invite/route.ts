import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      from: 'noreply@treinex.com',
      to,
      subject: `${trainerName} te invita a entrenar en Heracles`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#f97316;font-size:36px;font-weight:900;letter-spacing:0.15em;margin:0;">HERACLES</h1>
              <p style="color:#52525b;font-size:13px;margin:6px 0 0;">Plataforma de entrenamiento personalizado</p>
            </div>

            <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;">
              <p style="color:#71717a;font-size:14px;margin:0 0 6px;">Tu entrenador</p>
              <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 20px;">${trainerName}</h2>

              <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 8px;">
                Te ha invitado a unirte a su plataforma de entrenamiento personalizado.
              </p>

              ${hasForm ? `
              <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0 0 24px;">
                Después de registrarte, completarás un breve cuestionario para que tu entrenador pueda diseñar tu programa.
              </p>
              ` : '<div style="margin-bottom:24px;"></div>'}

              <a href="${inviteUrl}"
                style="display:block;background:#f97316;color:#ffffff;text-decoration:none;text-align:center;padding:15px 24px;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:0.02em;">
                Aceptar invitación ?
              </a>

              <p style="color:#3f3f46;font-size:12px;text-align:center;margin:16px 0 0;">
                Si el botón no funciona, copia este link:<br>
                <span style="color:#52525b;word-break:break-all;">${inviteUrl}</span>
              </p>
            </div>

            <div style="text-align:center;margin-top:24px;">
              <p style="color:#3f3f46;font-size:12px;margin:0;">
                Este link es personal · Expira en 7 días
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: data?.id })

  } catch (e: any) {
    console.error('Send invite error:', e)
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}
