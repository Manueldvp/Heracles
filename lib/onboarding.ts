type SupabaseLike = {
  from: (table: string) => {
    select: (columns?: string, options?: Record<string, unknown>) => any
    insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => any
    upsert: (values: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>) => any
  }
}

export type OnboardingProgress = {
  user_id: string
  created_client: boolean
  created_routine: boolean
  assigned_routine: boolean
  completed: boolean
}

export function resolveOnboardingCompletion(progress: Pick<OnboardingProgress, 'created_client' | 'created_routine' | 'assigned_routine'>) {
  return progress.created_client && progress.created_routine && progress.assigned_routine
}

export async function ensureOnboardingProgress(supabase: SupabaseLike, userId: string): Promise<OnboardingProgress> {
  const { data: existing } = await supabase
    .from('onboarding_progress')
    .select('user_id, created_client, created_routine, assigned_routine, completed')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return {
      user_id: userId,
      created_client: Boolean(existing.created_client),
      created_routine: Boolean(existing.created_routine),
      assigned_routine: Boolean(existing.assigned_routine),
      completed: Boolean(existing.completed),
    }
  }

  const row: OnboardingProgress = {
    user_id: userId,
    created_client: false,
    created_routine: false,
    assigned_routine: false,
    completed: false,
  }

  await supabase.from('onboarding_progress').insert(row)
  return row
}

export async function getOnboardingProgress(supabase: SupabaseLike, userId: string) {
  return ensureOnboardingProgress(supabase, userId)
}

export async function updateOnboardingProgress(
  supabase: SupabaseLike,
  userId: string,
  patch: Partial<Pick<OnboardingProgress, 'created_client' | 'created_routine' | 'assigned_routine' | 'completed'>>
) {
  const current = await ensureOnboardingProgress(supabase, userId)

  const next: OnboardingProgress = {
    ...current,
    ...patch,
  }

  next.completed = patch.completed === true
    ? true
    : resolveOnboardingCompletion(next)

  await supabase.from('onboarding_progress').upsert(next, { onConflict: 'user_id' })
  return next
}
