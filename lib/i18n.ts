import es from '@/locales/es.json'
import en from '@/locales/en.json'

export type Locale = 'es' | 'en'

const dictionaries = {
  es,
  en,
} as const

function resolvePath(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }

    return undefined
  }, source)
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template

  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value))
  }, template)
}

export function getMessages(locale: Locale = 'es') {
  return dictionaries[locale] ?? dictionaries.es
}

export function getTranslationValue<T = unknown>(key: string, locale: Locale = 'es'): T {
  const message = resolvePath(getMessages(locale), key)
  if (message !== undefined) return message as T

  const fallback = resolvePath(getMessages('es'), key)
  if (fallback !== undefined) return fallback as T

  return key as T
}

export function getTranslation(key: string, locale: Locale = 'es', values?: Record<string, string | number>) {
  const message = getTranslationValue<string>(key, locale)
  return typeof message === 'string' ? interpolate(message, values) : key
}

export function createTranslator(locale: Locale = 'es') {
  return (key: string, values?: Record<string, string | number>) => getTranslation(key, locale, values)
}
