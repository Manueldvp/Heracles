export type AssistantVisualState = 'idle' | 'greeting' | 'thinking' | 'talking' | 'focus' | 'motivating' | 'celebrating' | 'warning'
export type AssistantEvent = 'idle' | 'login' | 'workout-complete' | 'inactivity' | 'ai-interaction' | 'assistant-open'

export type AssistantTone = {
  variant: 'aggressive' | 'calm' | 'energetic' | 'neutral'
  animationSpeed: number
  bounceScale: number
  hoverScale: number
  glowClass: string
  accentClass: string
  bubbleClass: string
  orbClass: string
  statusLabel: string
}

export type AssistantConfig = {
  assistantName: string
  personality: string
  methodology: string
}

const CHAT_STORAGE_PREFIX = 'treinex-assistant-chat-history'

type AssistantProfileConfig = {
  assistant_name?: string | null
  assistant_personality?: string | null
  assistant_methodology?: string | null
  ai_trainer_name?: string | null
  ai_system_prompt?: string | null
}

const SURFACE_PREFIXES = [
  /^treinex dice:\s*/i,
  /^[^:]{1,32}\sdice:\s*/i,
  /^assistant:\s*/i,
  /^ai:\s*/i,
]

function cleanSection(text: string) {
  return text
    .replace(/^[\-\*\u2022]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSection(prompt: string, labels: string[]) {
  const normalized = prompt.replace(/\r/g, '')
  const lines = normalized.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    const lineLower = line.toLowerCase()
    const match = labels.some((label) => lineLower.includes(label))

    if (!match) continue

    const collected: string[] = []
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next].trim()
      if (!candidate) {
        if (collected.length > 0) break
        continue
      }

      if (candidate.endsWith(':') && collected.length > 0) break
      collected.push(candidate)
    }

    if (collected.length > 0) {
      return cleanSection(collected.join(' '))
    }
  }

  return ''
}

function inferMethodology(prompt: string) {
  const fragments = prompt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /(ciencia|experiencia|seguridad|progres|adapt|hábitos|tecn|consisten)/i.test(line))
    .slice(0, 3)

  return cleanSection(fragments.join(' ')) || 'Enfoque progresivo, claro y adaptado a cada cliente.'
}

function inferPersonality(prompt: string) {
  const fragments = prompt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /(motivador|directo|cercan|disciplin|calma|energ|amable|exigente)/i.test(line))
    .slice(0, 3)

  return cleanSection(fragments.join(' ')) || 'Motivador, cercano y profesional.'
}

export function extractAssistantConfig(
  configOrName?: AssistantProfileConfig | string | null,
  aiSystemPrompt?: string | null
): AssistantConfig {
  const config = typeof configOrName === 'object' && configOrName !== null
    ? configOrName
    : {
        ai_trainer_name: configOrName,
        ai_system_prompt: aiSystemPrompt,
      }
  const prompt = config.ai_system_prompt?.trim() || ''
  const personality = config.assistant_personality?.trim()
    || extractSection(prompt, ['tu personalidad', 'personalidad'])
    || inferPersonality(prompt)
  const methodology = config.assistant_methodology?.trim()
    || extractSection(prompt, ['metodología', 'metodologia', 'metodo', 'método', 'enfoque'])
    || inferMethodology(prompt)

  return {
    assistantName: config.assistant_name?.trim() || config.ai_trainer_name?.trim() || 'Treinex',
    personality,
    methodology,
  }
}

export function getAssistantTone(personality: string): AssistantTone {
  const value = personality.toLowerCase()

  if (/(agresiv|intenso|duro|militar|exigent)/i.test(value)) {
    return {
      variant: 'aggressive',
      animationSpeed: 1.3,
      bounceScale: 1.12,
      hoverScale: 1.06,
      glowClass: 'shadow-[0_0_36px_rgba(249,115,22,0.45)]',
      accentClass: 'text-orange-300',
      bubbleClass: 'border-orange-500/25 bg-orange-500/10 text-orange-50',
      orbClass: 'from-orange-500/30 via-orange-400/10 to-transparent',
      statusLabel: 'Activo',
    }
  }

  if (/(calmad|seren|suave|tranquil|zen)/i.test(value)) {
    return {
      variant: 'calm',
      animationSpeed: 0.8,
      bounceScale: 1.05,
      hoverScale: 1.04,
      glowClass: 'shadow-[0_0_28px_rgba(56,189,248,0.28)]',
      accentClass: 'text-sky-200',
      bubbleClass: 'border-sky-500/20 bg-sky-500/10 text-sky-50',
      orbClass: 'from-sky-500/25 via-sky-400/10 to-transparent',
      statusLabel: 'Sereno',
    }
  }

  if (/(energ|motiv|dinámic|impulso)/i.test(value)) {
    return {
      variant: 'energetic',
      animationSpeed: 1.15,
      bounceScale: 1.1,
      hoverScale: 1.05,
      glowClass: 'shadow-[0_0_34px_rgba(251,146,60,0.38)]',
      accentClass: 'text-emerald-200',
      bubbleClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-50',
      orbClass: 'from-emerald-500/25 via-orange-400/10 to-transparent',
      statusLabel: 'Activo',
    }
  }

  return {
    variant: 'neutral',
    animationSpeed: 1,
    bounceScale: 1.08,
    hoverScale: 1.045,
    glowClass: 'shadow-[0_0_32px_rgba(251,146,60,0.3)]',
    accentClass: 'text-zinc-200',
    bubbleClass: 'border-border bg-card/95 text-foreground',
    orbClass: 'from-primary/20 via-primary/5 to-transparent',
    statusLabel: 'Activo',
  }
}

export function getMethodologySummary(methodology: string) {
  const summary = methodology
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?]/)
    .map((chunk) => chunk.trim())
    .find(Boolean)

  return summary || 'Acompañamiento adaptado a tu progreso.'
}

export function sanitizeAssistantSurfaceText(message: string) {
  let next = message.trim()

  SURFACE_PREFIXES.forEach((pattern) => {
    next = next.replace(pattern, '')
  })

  next = next
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')

  return next.replace(/\s+/g, ' ').trim()
}

export function getAssistantChatStorageKey(userId: string) {
  return `${CHAT_STORAGE_PREFIX}:${userId}`
}

export function clearAssistantChatStorage(userId?: string) {
  if (typeof window === 'undefined') return

  if (userId) {
    window.sessionStorage.removeItem(getAssistantChatStorageKey(userId))
    return
  }

  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith(`${CHAT_STORAGE_PREFIX}:`))
    .forEach((key) => window.sessionStorage.removeItem(key))
}

export function getAutonomousAssistantMessages(personality: string) {
  const tone = getAssistantTone(personality)

  if (tone.variant === 'aggressive') {
    return [
      'Vamos. No rompas la racha ahora.',
      'Todavia hay trabajo por hacer.',
      'La disciplina se nota en los dias flojos.',
    ]
  }

  if (tone.variant === 'calm') {
    return [
      'Sigo aqui cuando quieras retomar.',
      'Un paso pequeño tambien cuenta hoy.',
      'La constancia tranquila tambien construye mucho.',
    ]
  }

  if (tone.variant === 'energetic') {
    return [
      'Vamos, que hoy tambien suma.',
      'Sigo por aqui. Listo para activar el siguiente paso.',
      'La consistencia lo cambia todo.',
    ]
  }

  return [
    'Sigo aqui. Cuando quieras, seguimos.',
    'Hoy tambien cuenta, aunque sea poco.',
    'La constancia termina marcando la diferencia.',
  ]
}

export function buildAssistantMessage({
  assistantName,
  personality,
  event,
  clientName,
}: {
  assistantName: string
  personality: string
  event: AssistantEvent
  clientName?: string
}) {
  const tone = getAssistantTone(personality)
  const firstName = clientName?.split(' ')[0] || 'equipo'

  if (event === 'login') {
    if (tone.variant === 'aggressive') return `${firstName}, hoy venimos a empujar en serio.`
    if (tone.variant === 'calm') return `Hola ${firstName}, vamos paso a paso y con buena tecnica.`
    if (tone.variant === 'energetic') return `${firstName}, vamos con todo hoy.`
    return `${firstName}, listo para acompanarte hoy.`
  }

  if (event === 'workout-complete') {
    if (tone.variant === 'aggressive') return 'Trabajo hecho. No aflojes ahora.'
    if (tone.variant === 'calm') return 'Buen cierre. Suma constancia y recupera bien.'
    if (tone.variant === 'energetic') return 'Tremenda sesion. Seguimos construyendo.'
    return 'Muy buena sesion. Seguimos asi.'
  }

  if (event === 'inactivity') {
    if (tone.variant === 'aggressive') return 'No te me desconectes, todavia queda trabajo.'
    if (tone.variant === 'calm') return 'Cuando quieras, retomamos con calma.'
    if (tone.variant === 'energetic') return 'Vuelvo por aqui cuando quieras seguir.'
    return 'Sigo aqui por si quieres revisar algo.'
  }

  if (event === 'ai-interaction') {
    if (tone.variant === 'aggressive') return 'Voy al grano.'
    if (tone.variant === 'calm') return 'Te respondo con claridad.'
    if (tone.variant === 'energetic') return 'Vamos a resolverlo.'
    return 'Te ayudo con eso.'
  }

  if (event === 'assistant-open') {
    if (tone.variant === 'aggressive') return 'Bien. Dime que resolvemos.'
    if (tone.variant === 'calm') return 'Estoy aqui, vamos con calma.'
    if (tone.variant === 'energetic') return 'Perfecto, activemos esto.'
    return 'Te escucho.'
  }

  return sanitizeAssistantSurfaceText(`${assistantName} esta contigo.`)
}
