import Stripe from 'stripe'
import { PlanType } from '@/lib/billing'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export function getStripePriceId(planType: Exclude<PlanType, 'free'>) {
  if (planType === 'studio') {
    return process.env.NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID
  }

  return process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
}
