type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>
}

export type PublicTrainerProfile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  specialty: string | null
  certifications: string[] | null
  whatsapp_number: string | null
  total_clients: number
  active_clients: number
}

export type ApplyToTrainerResult = {
  action: 'linked-existing-user' | 'created-pending-invite'
  client_id: string
  invite_token: string | null
  invite_token_expires_at: string | null
  email: string
  message: string
}

function unwrapSingleRow<T>(data: unknown) {
  if (Array.isArray(data)) {
    return (data[0] as T | undefined) ?? null
  }

  return (data as T | null) ?? null
}

export async function getPublicTrainerProfile(client: RpcCapableClient, username: string) {
  const result = await client.rpc('get_public_trainer_profile', { p_username: username })

  if (result.error) return { data: null as PublicTrainerProfile | null, error: result.error }
  return { data: unwrapSingleRow<PublicTrainerProfile>(result.data), error: null }
}

export async function getPublicTrainerProfileById(client: RpcCapableClient, trainerId: string) {
  const result = await client.rpc('get_public_trainer_profile_by_id', { p_trainer_id: trainerId })

  if (result.error) return { data: null as PublicTrainerProfile | null, error: result.error }
  return { data: unwrapSingleRow<PublicTrainerProfile>(result.data), error: null }
}

export async function applyToTrainer(
  client: RpcCapableClient,
  input: {
    trainerId: string
    fullName: string
    email: string
    goal?: string | null
  },
) {
  const result = await client.rpc('apply_to_public_trainer', {
    p_trainer_id: input.trainerId,
    p_full_name: input.fullName,
    p_email: input.email,
    p_goal: input.goal ?? null,
  })

  if (result.error) return { data: null as ApplyToTrainerResult | null, error: result.error }
  return { data: unwrapSingleRow<ApplyToTrainerResult>(result.data), error: null }
}

export function normalizeWhatsAppNumber(value?: string | null) {
  return (value ?? '').replace(/[^\d]/g, '')
}

export function buildWhatsAppLink(trainerName: string, whatsappNumber?: string | null) {
  const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber)
  if (!normalizedNumber) return null

  const message = encodeURIComponent(
    `Hola ${trainerName}, quiero información sobre entrenamiento contigo`,
  )

  return `https://wa.me/${normalizedNumber}?text=${message}`
}
