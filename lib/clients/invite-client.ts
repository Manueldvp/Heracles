import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

type InviteClientParams = {
  trainerId: string
  email: string
  fullName?: string | null
  formId?: string | null
}

type InviteClientResult =
  | {
      ok: true
      action: 'linked-existing-user'
      clientId: string
      clientStatus: 'active'
      email: string
      message: string
    }
  | {
      ok: true
      action: 'created-pending-invite'
      clientId: string
      clientStatus: 'pending'
      email: string
      inviteToken: string
      inviteTokenExpiresAt: string
      message: string
    }

type InviteClientFailure = {
  ok: false
  code:
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'INVALID_EMAIL'
    | 'CLIENT_ALREADY_EXISTS'
    | 'LOOKUP_FAILED'
    | 'INSERT_FAILED'
  message: string
}

type ClientLookupRow = {
  id: string
}

type ClientInsertRow = {
  id: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function resolveFullName(fullName: string | null | undefined, email: string) {
  const sanitized = fullName?.trim()
  if (sanitized) return sanitized

  const [localPart] = email.split('@')
  return localPart || email
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function unwrapRpcValue<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function isUniqueViolation(error: PostgrestError | null) {
  if (!error) return false
  return error.code === '23505' || /duplicate key|unique constraint/i.test(error.message ?? '')
}

async function findExistingClient(
  supabase: SupabaseClient,
  trainerId: string,
  normalizedEmail: string,
  existingUserId: string | null
) {
  const emailLookup = supabase
    .from('clients')
    .select('id')
    .eq('trainer_id', trainerId)
    .eq('email', normalizedEmail)
    .limit(1)
    .maybeSingle<ClientLookupRow>()

  const userLookup = existingUserId
    ? supabase
        .from('clients')
        .select('id')
        .eq('trainer_id', trainerId)
        .eq('user_id', existingUserId)
        .limit(1)
        .maybeSingle<ClientLookupRow>()
    : Promise.resolve({ data: null, error: null as PostgrestError | null })

  const [{ data: emailMatch, error: emailError }, { data: userMatch, error: userError }] =
    await Promise.all([emailLookup, userLookup])

  if (emailError) throw emailError
  if (userError) throw userError

  return emailMatch ?? userMatch ?? null
}

export async function inviteClient(
  supabase: SupabaseClient,
  params: InviteClientParams
): Promise<InviteClientResult | InviteClientFailure> {
  const normalizedEmail = normalizeEmail(params.email)

  if (!isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      code: 'INVALID_EMAIL',
      message: 'Ingresa un email válido para poder invitar a este cliente.',
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      code: 'UNAUTHENTICATED',
      message: 'Tu sesión expiró. Vuelve a iniciar sesión e inténtalo otra vez.',
    }
  }

  if (user.id !== params.trainerId) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'No tienes permisos para invitar clientes con esta cuenta.',
    }
  }

  const resolvedName = resolveFullName(params.fullName, normalizedEmail)
  const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_by_email', {
    p_email: normalizedEmail,
  })

  if (userIdError) {
    console.error('get_user_id_by_email failed:', userIdError)
    return {
      ok: false,
      code: 'LOOKUP_FAILED',
      message: 'No pudimos validar si ese email ya tiene cuenta. Inténtalo nuevamente.',
    }
  }

  const existingUserId = unwrapRpcValue(userIdData) as string | null

  try {
    const existingClient = await findExistingClient(supabase, params.trainerId, normalizedEmail, existingUserId)

    if (existingClient) {
      return {
        ok: false,
        code: 'CLIENT_ALREADY_EXISTS',
        message: 'Este cliente ya está en tu lista.',
      }
    }
  } catch (error) {
    console.error('clients duplicate lookup failed:', error)
    return {
      ok: false,
      code: 'LOOKUP_FAILED',
      message: 'No pudimos comprobar si el cliente ya existe. Inténtalo nuevamente.',
    }
  }

  if (existingUserId) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        trainer_id: params.trainerId,
        user_id: existingUserId,
        email: normalizedEmail,
        full_name: resolvedName,
        status: 'active',
        invite_token: null,
        invite_token_expires_at: null,
        onboarding_completed: false,
      })
      .select('id')
      .single<ClientInsertRow>()

    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: 'CLIENT_ALREADY_EXISTS',
        message: 'Este cliente ya está en tu lista.',
      }
    }

    if (error || !data) {
      console.error('clients insert existing-user failed:', error)
      return {
        ok: false,
        code: 'INSERT_FAILED',
        message: 'No pudimos agregar al cliente a tu lista. Inténtalo nuevamente.',
      }
    }

    return {
      ok: true,
      action: 'linked-existing-user',
      clientId: data.id,
      clientStatus: 'active',
      email: normalizedEmail,
      message: 'Cliente agregado. Como ya tenía cuenta, ya puede entrar a su panel con ese email.',
    }
  }

  const inviteToken = crypto.randomUUID()
  const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      trainer_id: params.trainerId,
      email: normalizedEmail,
      full_name: resolvedName,
      invite_token: inviteToken,
      invite_token_expires_at: inviteTokenExpiresAt,
      form_id: params.formId ?? null,
      onboarding_completed: false,
      status: 'pending',
      goal: 'muscle_gain',
      level: 'beginner',
    })
    .select('id')
    .single<ClientInsertRow>()

  if (isUniqueViolation(error)) {
    return {
      ok: false,
      code: 'CLIENT_ALREADY_EXISTS',
      message: 'Este cliente ya está en tu lista.',
    }
  }

  if (error || !data) {
    console.error('clients insert pending invite failed:', error)
    return {
      ok: false,
      code: 'INSERT_FAILED',
      message: 'No pudimos crear la invitación del cliente. Inténtalo nuevamente.',
    }
  }

  return {
    ok: true,
    action: 'created-pending-invite',
    clientId: data.id,
    clientStatus: 'pending',
    email: normalizedEmail,
    inviteToken,
    inviteTokenExpiresAt,
    message: 'Invitación creada. El cliente recibirá un link para registrarse.',
  }
}
