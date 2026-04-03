type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>
}

type UpdateClientProfileInput = {
  full_name?: string
  age?: number | null
  weight?: number | null
  height?: number | null
  goal?: string
  level?: string
  restrictions?: string
  avatar_url?: string
}

export async function updateClientProfile(client: RpcCapableClient, input: UpdateClientProfileInput) {
  return client.rpc('update_client_profile', {
    p_full_name: input.full_name ?? null,
    p_age: input.age ?? null,
    p_weight: input.weight ?? null,
    p_height: input.height ?? null,
    p_goal: input.goal ?? null,
    p_level: input.level ?? null,
    p_restrictions: input.restrictions ?? null,
    p_avatar_url: input.avatar_url ?? null,
  })
}

export async function setActiveRoutine(client: RpcCapableClient, routineId: string) {
  return client.rpc('set_active_routine', { p_routine_id: routineId })
}

export async function setActiveNutrition(client: RpcCapableClient, planId: string) {
  return client.rpc('set_active_nutrition', { p_plan_id: planId })
}

export async function getClientByInviteToken<T>(client: RpcCapableClient, token: string) {
  const result = await client.rpc('get_client_by_invite_token', { token })

  if (result.error) return { data: null as T | null, error: result.error }

  const row = Array.isArray(result.data)
    ? (result.data[0] as T | undefined) ?? null
    : (result.data as T | null)

  return { data: row, error: null }
}
