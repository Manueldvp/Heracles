import { NextResponse } from 'next/server'
import { getPlanConfig, normalizePlanType } from '@/lib/billing'
import { APP_URL } from '@/lib/branding'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getWebpayTransaction } from '@/lib/webpay'

export const runtime = 'nodejs'

function redirectTo(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(path, APP_URL)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })
  }

  return NextResponse.redirect(url)
}

async function handleConfirmation(token: string | null, failureToken?: string | null) {
  if (!token || failureToken) {
    return redirectTo('/payment/error', { reason: failureToken ? 'cancelled' : 'missing-token' })
  }

  try {
    const transaction = getWebpayTransaction()
    const response = await transaction.commit(token)
    const approved = response?.response_code === 0 && response?.status === 'AUTHORIZED'

    const sessionId = response?.session_id
    const buyOrder = response?.buy_order

    let paymentAttemptQuery = supabaseAdmin
      .from('payment_attempts')
      .select('id, user_id, plan_type, status')
      .eq('provider', 'webpay')

    if (sessionId) {
      paymentAttemptQuery = paymentAttemptQuery.eq('session_id', sessionId)
    } else if (buyOrder) {
      paymentAttemptQuery = paymentAttemptQuery.eq('buy_order', buyOrder)
    } else {
      throw new Error('No se pudo identificar el intento de pago')
    }

    const { data: paymentAttempt } = await paymentAttemptQuery.maybeSingle()
    if (!paymentAttempt) {
      throw new Error('No existe el intento de pago asociado')
    }

    const planType = normalizePlanType(paymentAttempt.plan_type)

    await supabaseAdmin
      .from('payment_attempts')
      .update({
        status: approved ? 'approved' : 'failed',
        webpay_token: token,
        authorization_code: response?.authorization_code ?? null,
        committed_at: new Date().toISOString(),
        raw_response: response,
      })
      .eq('id', paymentAttempt.id)

    if (!approved || planType === 'free') {
      return redirectTo('/payment/error', { plan: planType, reason: 'rejected' })
    }

    const planConfig = getPlanConfig(planType)

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: paymentAttempt.user_id,
        plan_type: planType,
        active: true,
        client_limit: planConfig.clientLimit,
        ai_limit: planConfig.aiLimit,
      },
      { onConflict: 'user_id' }
    )

    return redirectTo('/payment/success', { plan: planType })
  } catch (error) {
    console.error('webpay confirm error:', error)
    return redirectTo('/payment/error', { reason: 'confirm-error' })
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return handleConfirmation(url.searchParams.get('token_ws'), url.searchParams.get('TBK_TOKEN'))
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const token = formData.get('token_ws')
  const failureToken = formData.get('TBK_TOKEN')

  return handleConfirmation(
    typeof token === 'string' ? token : null,
    typeof failureToken === 'string' ? failureToken : null
  )
}
