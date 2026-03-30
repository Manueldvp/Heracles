import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { normalizePlanType } from '@/lib/billing'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createBuyOrder, getWebpayPlanAmount, getWebpayReturnUrl, getWebpayTransaction, isPaidPlan } from '@/lib/webpay'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para continuar' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const planType = normalizePlanType(body.planType)

    if (!isPaidPlan(planType)) {
      return NextResponse.json({ error: 'Selecciona un plan válido' }, { status: 400 })
    }

    const attemptId = randomUUID()
    const buyOrder = createBuyOrder()
    const sessionId = attemptId
    const amount = getWebpayPlanAmount(planType)
    const transaction = getWebpayTransaction()

    await supabaseAdmin.from('payment_attempts').insert({
      id: attemptId,
      user_id: user.id,
      provider: 'webpay',
      plan_type: planType,
      amount,
      buy_order: buyOrder,
      session_id: sessionId,
      status: 'pending',
    })

    const response = await transaction.create(buyOrder, sessionId, amount, getWebpayReturnUrl())

    await supabaseAdmin
      .from('payment_attempts')
      .update({
        webpay_token: response.token,
        raw_response: response,
      })
      .eq('id', attemptId)

    return NextResponse.json({
      url: response.url,
      token: response.token,
    })
  } catch (error) {
    console.error('webpay create error:', error)
    return NextResponse.json({ error: 'No se pudo iniciar el pago con Webpay' }, { status: 500 })
  }
}
