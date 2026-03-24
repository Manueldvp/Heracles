export const APP_NAME = 'Treinex'
export const APP_TAGLINE = 'Entrena con estructura. Escala con claridad.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const SUPPORT_EMAIL = process.env.TREINEX_SUPPORT_EMAIL ?? 'support@treinex.com'
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? 'Treinex <noreply@treinex.com>'

export function getDisplayAppName(value?: string | null) {
  return value?.trim() || APP_NAME
}
