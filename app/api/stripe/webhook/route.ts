import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PLAN_CONFIG, PlanType, normalizePlanType } from '@/lib/billing'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

async function syncSubscription({
  userId,
  planType,
  stripeCustomerId,
  stripeSubscriptionId,
  active,
}: {
  userId: string
  planType: PlanType
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  active: boolean
}) {
  const config = PLAN_CONFIG[planType]

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    plan_type: planType,
    active,
    client_limit: config.clientLimit,
    ai_limit: config.aiLimit,
    stripe_customer_id: stripeCustomerId ?? null,
    stripe_subscription_id: stripeSubscriptionId ?? null,
  }, { onConflict: 'user_id' })
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('stripe webhook signature error:', error)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata ?? {}
      const userId = metadata.user_id
      const planType = normalizePlanType(metadata.plan_type)

      if (userId) {
        await syncSubscription({
          userId,
          planType,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
          active: true,
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const metadata = subscription.metadata ?? {}
      const userId = metadata.user_id
      const stripeSubscriptionId = subscription.id
      const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null

      if (userId) {
        await syncSubscription({
          userId,
          planType: 'free',
          stripeCustomerId,
          stripeSubscriptionId,
          active: true,
        })
      } else {
        const filters = stripeCustomerId
          ? `stripe_subscription_id.eq.${stripeSubscriptionId},stripe_customer_id.eq.${stripeCustomerId}`
          : `stripe_subscription_id.eq.${stripeSubscriptionId}`

        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_type: 'free',
            active: true,
            client_limit: PLAN_CONFIG.free.clientLimit,
            ai_limit: PLAN_CONFIG.free.aiLimit,
            stripe_subscription_id: stripeSubscriptionId,
          })
          .or(filters)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('stripe webhook handler error:', error)
    return NextResponse.json({ error: 'No se pudo procesar el webhook' }, { status: 500 })
  }
}
