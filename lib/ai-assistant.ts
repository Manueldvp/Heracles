export type AssistantVisualState = 'idle' | 'thinking' | 'celebrate'
export type AssistantEvent = 'idle' | 'login' | 'workout-complete' | 'inactivity' | 'ai-interaction'

export type AssistantTone = {
  variant: 'aggressive' | 'calm' | 'energetic' | 'neutral'
  animationSpeed: number
  accentClass: string
  bubbleClass: string
}

export type AssistantConfig = {
  assistantName: string
  personality: string
  methodology: string
}

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

export function extractAssistantConfig(aiTrainerName?: string | null, aiSystemPrompt?: string | null): AssistantConfig {
  const prompt = aiSystemPrompt?.trim() || ''
  const personality = extractSection(prompt, ['tu personalidad', 'personalidad']) || inferPersonality(prompt)
  const methodology = extractSection(prompt, ['metodología', 'metodologia', 'metodo', 'método', 'enfoque']) || inferMethodology(prompt)

  return {
    assistantName: aiTrainerName?.trim() || 'Treinex',
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
      accentClass: 'text-orange-300',
      bubbleClass: 'border-orange-500/25 bg-orange-500/10 text-orange-50',
    }
  }

  if (/(calmad|seren|suave|tranquil|zen)/i.test(value)) {
    return {
      variant: 'calm',
      animationSpeed: 0.8,
      accentClass: 'text-sky-200',
      bubbleClass: 'border-sky-500/20 bg-sky-500/10 text-sky-50',
    }
  }

  if (/(energ|motiv|dinámic|impulso)/i.test(value)) {
    return {
      variant: 'energetic',
      animationSpeed: 1.15,
      accentClass: 'text-emerald-200',
      bubbleClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-50',
    }
  }

  return {
    variant: 'neutral',
    animationSpeed: 1,
    accentClass: 'text-zinc-200',
    bubbleClass: 'border-border bg-card/95 text-foreground',
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
    if (tone.variant === 'aggressive') return `${assistantName} dice: ${firstName}, hoy venimos a empujar en serio.`
    if (tone.variant === 'calm') return `${assistantName} dice: Hola ${firstName}, vamos paso a paso y con buena técnica.`
    if (tone.variant === 'energetic') return `${assistantName} dice: ${firstName}, vamos con todo hoy.`
    return `${assistantName} dice: ${firstName}, listo para acompañarte hoy.`
  }

  if (event === 'workout-complete') {
    if (tone.variant === 'aggressive') return `${assistantName} dice: Trabajo hecho. No aflojes ahora.`
    if (tone.variant === 'calm') return `${assistantName} dice: Buen cierre. Suma constancia y recupera bien.`
    if (tone.variant === 'energetic') return `${assistantName} dice: Tremenda sesión. Seguimos construyendo.`
    return `${assistantName} dice: Muy buena sesión. Seguimos así.`
  }

  if (event === 'inactivity') {
    if (tone.variant === 'aggressive') return `${assistantName} dice: No te me desconectes, todavía queda trabajo.`
    if (tone.variant === 'calm') return `${assistantName} dice: Cuando quieras, retomamos con calma.`
    if (tone.variant === 'energetic') return `${assistantName} dice: Vuelvo por aquí cuando quieras seguir.`
    return `${assistantName} dice: Sigo aquí por si quieres revisar algo.`
  }

  if (event === 'ai-interaction') {
    if (tone.variant === 'aggressive') return `${assistantName} dice: Voy al grano.`
    if (tone.variant === 'calm') return `${assistantName} dice: Te respondo con claridad.`
    if (tone.variant === 'energetic') return `${assistantName} dice: Vamos a resolverlo.`
    return `${assistantName} dice: Te ayudo con eso.`
  }

  return `${assistantName} está contigo.`
}
