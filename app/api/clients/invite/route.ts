import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_NAME, EMAIL_FROM } from '@/lib/branding'
import { buildInviteEmail } from '@/lib/email/templates'
import { getTrainerBillingStatus } from '@/lib/billing'
import { updateOnboardingProgress } from '@/lib/onboarding'
import { inviteClient } from '@/lib/clients/invite-client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { email, fullName, formId } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Falta el email del cliente' }, { status: 400 })
    }

    const [{ data: profile }, billing] = await Promise.all([
      supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
      getTrainerBillingStatus(supabase, user.id),
    ])

    if (!profile || profile.role !== 'trainer') {
      return NextResponse.json({ error: 'Solo entrenadores pueden invitar clientes' }, { status: 403 })
    }

    if (!billing.canAddClient) {
      return NextResponse.json({
        error: 'Has alcanzado el límite de clientes de tu plan gratuito. Actualiza para seguir invitando clientes.',
        upgradeRequired: true,
        status: billing,
      }, { status: 402 })
    }

    const inviteResult = await inviteClient(supabase, {
      trainerId: user.id,
      email: String(email),
      fullName: typeof fullName === 'string' ? fullName : null,
      formId: typeof formId === 'string' ? formId : null,
    })

    if (!inviteResult.ok) {
      const status =
        inviteResult.code === 'UNAUTHENTICATED'
          ? 401
          : inviteResult.code === 'FORBIDDEN'
            ? 403
            : inviteResult.code === 'CLIENT_ALREADY_EXISTS'
              ? 409
              : inviteResult.code === 'INVALID_EMAIL'
                ? 400
              : 400

      return NextResponse.json({ error: inviteResult.message, code: inviteResult.code }, { status })
    }

    await updateOnboardingProgress(supabase, user.id, { created_client: true })

    let inviteUrl: string | null = null

    if (inviteResult.action === 'created-pending-invite') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      inviteUrl = `${appUrl}/invite/${inviteResult.inviteToken}`
      const trainerName = profile.full_name ?? 'Tu entrenador'

      const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: inviteResult.email,
        subject: `${trainerName} te invita a entrenar en ${APP_NAME}`,
        html: buildInviteEmail({
          trainerName,
          inviteUrl,
          hasForm: Boolean(formId),
        }),
      })

      if (emailError) {
        console.error('invite email error:', emailError)
        await supabase
          .from('clients')
          .delete()
          .eq('id', inviteResult.clientId)
          .eq('trainer_id', user.id)
          .eq('status', 'pending')

        return NextResponse.json({ error: emailError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      ok: true,
      action: inviteResult.action,
      message: inviteResult.message,
      clientId: inviteResult.clientId,
      clientStatus: inviteResult.clientStatus,
      email: inviteResult.email,
      inviteUrl,
      status: {
        ...billing,
        clientCount: billing.clientCount + 1,
        remainingClientSlots: billing.remainingClientSlots === null ? null : Math.max(0, billing.remainingClientSlots - 1),
        canAddClient: billing.subscription.clientLimit === null || (billing.clientCount + 1) < (billing.subscription.clientLimit ?? 5),
      },
    })
  } catch (error) {
    console.error('clients invite error:', error)
    return NextResponse.json({ error: 'No se pudo enviar la invitación' }, { status: 500 })
  }
}
