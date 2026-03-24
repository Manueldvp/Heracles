import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { APP_NAME, APP_URL, EMAIL_FROM } from '@/lib/branding'
import { buildVerificationEmail } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, password, role = 'trainer', token } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedRole = role === 'client' ? 'client' : 'trainer'
    const redirectTo = normalizedRole === 'client' && token
      ? `${APP_URL}/onboarding/${token}`
      : `${APP_URL}/dashboard`

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password,
      options: {
        redirectTo,
        data: {
          full_name: String(name).trim(),
          role: normalizedRole,
        },
      },
    })

    if (error || !data?.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message ?? 'No se pudo preparar el registro' },
        { status: 400 }
      )
    }

    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: normalizedEmail,
      subject: `Confirma tu cuenta en ${APP_NAME}`,
      html: buildVerificationEmail({
        fullName: String(name).trim(),
        verifyUrl: data.properties.action_link,
        roleLabel: normalizedRole === 'client' ? 'cliente' : 'entrenador',
      }),
    })

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno'
    console.error('register route error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
