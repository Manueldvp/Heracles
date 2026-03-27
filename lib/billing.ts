export const FREE_CLIENT_LIMIT = 5
export const FREE_AI_LIMIT = 3

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
    planType: 'free' | 'premium'
    active: boolean
    clientLimit: number | null
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

export async function ensureSubscriptionRecord(supabase: SupabaseLike, userId: string) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type, active, client_limit')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return {
      planType: (existing.plan_type === 'premium' ? 'premium' : 'free') as 'premium' | 'free',
      active: existing.active !== false,
      clientLimit: existing.plan_type === 'premium' ? null : Number(existing.client_limit ?? FREE_CLIENT_LIMIT),
    }
  }

  const defaultRow = {
    user_id: userId,
    plan_type: 'free',
    active: true,
    client_limit: FREE_CLIENT_LIMIT,
  }

  await supabase.from('subscriptions').insert(defaultRow)

  return {
    planType: 'free' as const,
    active: true,
    clientLimit: FREE_CLIENT_LIMIT,
  }
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
  const remainingClientSlots = subscription.planType === 'premium'
    ? null
    : Math.max(0, Number(subscription.clientLimit ?? FREE_CLIENT_LIMIT) - clientCount)

  const aiGenerationsRemaining = subscription.planType === 'premium'
    ? null
    : Math.max(0, FREE_AI_LIMIT - usage.generationsUsed)

  return {
    subscription,
    clientCount,
    remainingClientSlots,
    aiGenerationsUsed: usage.generationsUsed,
    aiGenerationsRemaining,
    canUseAi: subscription.planType === 'premium' || usage.generationsUsed < FREE_AI_LIMIT,
    canAddClient: subscription.planType === 'premium' || clientCount < Number(subscription.clientLimit ?? FREE_CLIENT_LIMIT),
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

  if (status.subscription.planType === 'premium') {
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
      aiGenerationsRemaining: Math.max(0, FREE_AI_LIMIT - nextUsed),
      canUseAi: nextUsed < FREE_AI_LIMIT,
    },
  }
}
