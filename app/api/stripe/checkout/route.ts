import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureSubscriptionRecord, getPlanConfig, getPlanLabel, normalizePlanType, PlanType } from '@/lib/billing'
import { stripe, getStripePriceId } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const planType = normalizePlanType(body.planType) as PlanType

    if (planType === 'free') {
      return NextResponse.json({ error: 'Selecciona un plan de pago válido' }, { status: 400 })
    }

    const priceId = getStripePriceId(planType)
    if (!priceId) {
      return NextResponse.json({ error: 'Falta configurar el price ID de Stripe' }, { status: 500 })
    }

    const subscription = await ensureSubscriptionRecord(supabase, user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const config = getPlanConfig(planType)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/precios?checkout=success`,
      cancel_url: `${appUrl}/precios?checkout=cancelled`,
      customer: subscription.stripeCustomerId ?? undefined,
      customer_email: subscription.stripeCustomerId ? undefined : (user.email ?? undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
      },
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message: `${getPlanLabel(planType)} · hasta ${config.clientLimit} clientes`,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('stripe checkout error:', error)
    return NextResponse.json({ error: 'No se pudo iniciar el checkout' }, { status: 500 })
  }
}
