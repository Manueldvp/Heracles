export const PLAN_CONFIG = {
  free: { clientLimit: 5, aiLimit: 3 },
  pro: { clientLimit: 20, aiLimit: 50 },
  studio: { clientLimit: 50, aiLimit: null },
} as const

export type PlanType = keyof typeof PLAN_CONFIG

type SupabaseLike = {
  from: (table: string) => {
    select: (columns?: string, options?: Record<string, unknown>) => any
    insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => any
    update: (values: Record<string, unknown>) => any
    upsert: (values: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>) => any
  }
}

export type BillingStatus = {
  subscription: {
    planType: PlanType
    active: boolean
    clientLimit: number | null
    aiLimit: number | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
  }
  clientCount: number
  remainingClientSlots: number | null
  aiGenerationsUsed: number
  aiGenerationsRemaining: number | null
  canUseAi: boolean
  canAddClient: boolean
}

export function getUsageMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

export function normalizePlanType(planType?: string | null): PlanType {
  if (planType === 'studio') return 'studio'
  if (planType === 'pro' || planType === 'premium') return 'pro'
  return 'free'
}

export function getPlanConfig(planType: PlanType) {
  return PLAN_CONFIG[planType]
}

export function getPlanLabel(planType: PlanType) {
  return planType === 'studio' ? 'Studio' : planType === 'pro' ? 'Pro' : 'Free'
}

export async function ensureSubscriptionRecord(supabase: SupabaseLike, userId: string) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type, active, client_limit, ai_limit, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const planType = normalizePlanType(existing.plan_type)
    const config = getPlanConfig(planType)
    return {
      planType,
      active: existing.active !== false,
      clientLimit: Number(existing.client_limit ?? config.clientLimit),
      aiLimit: existing.ai_limit === null ? config.aiLimit : Number(existing.ai_limit ?? config.aiLimit),
      stripeCustomerId: existing.stripe_customer_id ?? null,
      stripeSubscriptionId: existing.stripe_subscription_id ?? null,
    }
  }

  const defaultRow = {
    user_id: userId,
    plan_type: 'free',
    active: true,
    client_limit: PLAN_CONFIG.free.clientLimit,
    ai_limit: PLAN_CONFIG.free.aiLimit,
  }

  await supabase.from('subscriptions').insert(defaultRow)

  return {
    planType: 'free' as const,
    active: true,
    clientLimit: PLAN_CONFIG.free.clientLimit,
    aiLimit: PLAN_CONFIG.free.aiLimit,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }
}

export async function getUserPlan(supabase: SupabaseLike, userId: string) {
  return ensureSubscriptionRecord(supabase, userId)
}

export async function ensureAiUsageRow(supabase: SupabaseLike, userId: string, month = getUsageMonth()) {
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('user_id, month, generations_used')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  if (existing) {
    return {
      month,
      generationsUsed: Number(existing.generations_used ?? 0),
    }
  }

  await supabase.from('ai_usage').insert({
    user_id: userId,
    month,
    generations_used: 0,
  })

  return {
    month,
    generationsUsed: 0,
  }
}

export async function getTrainerBillingStatus(supabase: SupabaseLike, userId: string): Promise<BillingStatus> {
  const [subscription, usage, clientCountResult] = await Promise.all([
    ensureSubscriptionRecord(supabase, userId),
    ensureAiUsageRow(supabase, userId),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('trainer_id', userId),
  ])

  const clientCount = Number(clientCountResult.count ?? 0)
  const remainingClientSlots = subscription.clientLimit === null
    ? null
    : Math.max(0, subscription.clientLimit - clientCount)

  const aiGenerationsRemaining = subscription.aiLimit === null
    ? null
    : Math.max(0, subscription.aiLimit - usage.generationsUsed)

  return {
    subscription,
    clientCount,
    remainingClientSlots,
    aiGenerationsUsed: usage.generationsUsed,
    aiGenerationsRemaining,
    canUseAi: subscription.aiLimit === null || usage.generationsUsed < subscription.aiLimit,
    canAddClient: subscription.clientLimit === null || clientCount < subscription.clientLimit,
  }
}

export async function consumeAiGeneration(supabase: SupabaseLike, userId: string) {
  const status = await getTrainerBillingStatus(supabase, userId)

  if (!status.canUseAi) {
    return {
      ok: false as const,
      status,
      message: 'Has alcanzado el límite mensual de IA',
    }
  }

  if (status.subscription.aiLimit === null) {
    return {
      ok: true as const,
      status,
    }
  }

  const month = getUsageMonth()
  const nextUsed = status.aiGenerationsUsed + 1

  await supabase.from('ai_usage').upsert({
    user_id: userId,
    month,
    generations_used: nextUsed,
  }, { onConflict: 'user_id,month' })

  return {
    ok: true as const,
    status: {
      ...status,
      aiGenerationsUsed: nextUsed,
      aiGenerationsRemaining: Math.max(0, (status.subscription.aiLimit ?? 0) - nextUsed),
      canUseAi: nextUsed < (status.subscription.aiLimit ?? 0),
    },
  }
}
