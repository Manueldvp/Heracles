import { APP_URL } from '@/lib/branding'
import { PLAN_CONFIG, type PlanType } from '@/lib/billing'

const DEFAULT_WEBPAY_PRICES = {
  pro: 19990,
  studio: 39990,
} as const

type PaidPlanType = Exclude<PlanType, 'free'>

function parseAmount(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback
}

export function isPaidPlan(planType: PlanType): planType is PaidPlanType {
  return planType === 'pro' || planType === 'studio'
}

export function getWebpayPlanAmount(planType: PaidPlanType) {
  return planType === 'studio'
    ? parseAmount(process.env.WEBPAY_STUDIO_AMOUNT ?? process.env.NEXT_PUBLIC_WEBPAY_STUDIO_AMOUNT, DEFAULT_WEBPAY_PRICES.studio)
    : parseAmount(process.env.WEBPAY_PRO_AMOUNT ?? process.env.NEXT_PUBLIC_WEBPAY_PRO_AMOUNT, DEFAULT_WEBPAY_PRICES.pro)
}

export function formatClp(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getWebpayPlanSummary(planType: PaidPlanType) {
  const config = PLAN_CONFIG[planType]
  return {
    amount: getWebpayPlanAmount(planType),
    clientLimit: config.clientLimit,
    aiLimit: config.aiLimit,
  }
}

export function getWebpayReturnUrl() {
  return `${APP_URL}/api/webpay/confirm`
}

export function createBuyOrder() {
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.random().toString(36).slice(2, 8)
  return `tnx${timestamp}${random}`.slice(0, 26)
}

export function getWebpayTransaction() {
  const { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } = require('transbank-sdk')
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE
  const apiKey = process.env.WEBPAY_API_KEY

  if (commerceCode && apiKey) {
    return WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey)
  }

  return WebpayPlus.Transaction.buildForIntegration(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY
  )
}
