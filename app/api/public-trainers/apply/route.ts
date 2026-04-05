import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyToTrainer } from '@/lib/public-trainers'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { trainerId, fullName, email, goal } = await req.json()

    if (!trainerId || !fullName || !email) {
      return NextResponse.json(
        { error: 'Completa tu nombre, email y entrenador antes de enviar la solicitud.' },
        { status: 400 },
      )
    }

    const result = await applyToTrainer(supabase, {
      trainerId: String(trainerId),
      fullName: String(fullName),
      email: String(email),
      goal: typeof goal === 'string' ? goal : null,
    })

    if (result.error || !result.data) {
      const isDuplicate = result.error?.code === '23505'

      return NextResponse.json(
        {
          error: isDuplicate
            ? 'Ya tienes una solicitud o un perfil activo con este entrenador.'
            : result.error?.message ?? 'No pudimos procesar tu solicitud en este momento.',
        },
        { status: isDuplicate ? 409 : 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      action: result.data.action,
      clientId: result.data.client_id,
      email: result.data.email,
      message: result.data.message,
      inviteToken: result.data.invite_token,
      inviteTokenExpiresAt: result.data.invite_token_expires_at,
      inviteUrl: result.data.invite_token
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invite/${result.data.invite_token}`
        : null,
    })
  } catch (error) {
    console.error('public trainer apply error:', error)
    return NextResponse.json(
      { error: 'No pudimos enviar tu solicitud. Inténtalo nuevamente en unos minutos.' },
      { status: 500 },
    )
  }
}
