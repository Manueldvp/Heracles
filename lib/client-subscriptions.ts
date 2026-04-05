export type ClientSubscriptionStatus = 'active' | 'expired' | 'paused' | 'missing'

export type ClientSubscriptionRow = {
  id: string
  client_id: string
  trainer_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'paused'
}

export type ClientSubscriptionSummary = {
  status: ClientSubscriptionStatus
  label: string
  description: string
  isActive: boolean
  isExpired: boolean
  isPaused: boolean
  isMissing: boolean
  endDate: string | null
  daysRemaining: number | null
}

export type ClientSubscriptionIndicator = {
  label: string
  tone: 'success' | 'warning' | 'danger' | 'muted'
  sortOrder: number
}

export function summarizeClientSubscription(
  subscription?: Partial<ClientSubscriptionRow> | null,
  now = new Date(),
): ClientSubscriptionSummary {
  if (!subscription?.id && !subscription?.status && !subscription?.end_date) {
    return {
      status: 'missing',
      label: 'Sin suscripcion',
      description: 'Este cliente aun no tiene una suscripcion activa asignada.',
      isActive: false,
      isExpired: false,
      isPaused: false,
      isMissing: true,
      endDate: null,
      daysRemaining: null,
    }
  }

  const endDate = subscription.end_date ?? null
  const endTime = endDate ? new Date(endDate).getTime() : null
  const hasFutureEndDate = endTime !== null && endTime > now.getTime()
  const daysRemaining = endTime === null ? null : Math.max(0, Math.ceil((endTime - now.getTime()) / 86400000))

  if (subscription.status === 'paused') {
    return {
      status: 'paused',
      label: 'Pausada',
      description: 'El acceso del cliente esta pausado hasta reactivarlo.',
      isActive: false,
      isExpired: false,
      isPaused: true,
      isMissing: false,
      endDate,
      daysRemaining,
    }
  }

  if (subscription.status === 'active' && hasFutureEndDate) {
    return {
      status: 'active',
      label: 'Activa',
      description: daysRemaining !== null && daysRemaining <= 3
        ? 'La suscripcion esta activa, pero vence pronto.'
        : 'El cliente mantiene acceso completo a su plan.',
      isActive: true,
      isExpired: false,
      isPaused: false,
      isMissing: false,
      endDate,
      daysRemaining,
    }
  }

  return {
    status: 'expired',
    label: 'Expirada',
    description: 'El acceso del cliente vencio y necesita renovacion.',
    isActive: false,
    isExpired: true,
    isPaused: false,
    isMissing: false,
    endDate,
    daysRemaining,
  }
}

export function formatSubscriptionDate(value?: string | null) {
  if (!value) return 'Sin fecha definida'

  return new Date(value).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getClientSubscriptionIndicator(
  subscription?: Partial<ClientSubscriptionRow> | null,
  now = new Date(),
): ClientSubscriptionIndicator {
  const summary = summarizeClientSubscription(subscription, now)

  if (summary.isMissing || summary.endDate === null) {
    return {
      label: 'Sin plan',
      tone: 'muted',
      sortOrder: 3,
    }
  }

  if (summary.isPaused) {
    return {
      label: 'Pausado',
      tone: 'danger',
      sortOrder: 3,
    }
  }

  if (summary.isExpired) {
    return {
      label: 'Expirado',
      tone: 'danger',
      sortOrder: 3,
    }
  }

  if ((summary.daysRemaining ?? 0) <= 3) {
    return {
      label: 'Vence pronto',
      tone: 'warning',
      sortOrder: 0,
    }
  }

  const daysRemaining = summary.daysRemaining ?? 0

  return {
    label: `${daysRemaining} ${daysRemaining === 1 ? 'día restante' : 'días restantes'}`,
    tone: 'success',
    sortOrder: 1,
  }
}
