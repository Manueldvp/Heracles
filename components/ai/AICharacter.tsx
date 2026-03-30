'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { Eye, EyeOff, Sparkles, Wand2 } from 'lucide-react'
import idleAnimation from '@/components/ai/animations/idle.json'
import thinkingAnimation from '@/components/ai/animations/thinking.json'
import celebrateAnimation from '@/components/ai/animations/celebrate.json'
import { buildAssistantMessage, getAssistantTone, getMethodologySummary, type AssistantEvent, type AssistantVisualState } from '@/lib/ai-assistant'

const STORAGE_KEYS = {
  visible: 'treinex_ai_character_visible',
  animations: 'treinex_ai_character_animations',
} as const

export default function AICharacter({
  assistantName,
  personality,
  methodology,
  state,
  event,
  clientName,
  open,
  onClick,
  message,
}: {
  assistantName: string
  personality: string
  methodology: string
  state: AssistantVisualState
  event: AssistantEvent
  clientName?: string
  open: boolean
  onClick: () => void
  message?: string
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const tone = useMemo(() => getAssistantTone(personality), [personality])
  const methodologySummary = useMemo(() => getMethodologySummary(methodology), [methodology])

  useEffect(() => {
    const savedVisible = localStorage.getItem(STORAGE_KEYS.visible)
    const savedAnimations = localStorage.getItem(STORAGE_KEYS.animations)
    setIsVisible(savedVisible !== 'false')
    setAnimationsEnabled(savedAnimations !== 'false')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.visible, String(isVisible))
  }, [hydrated, isVisible])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.animations, String(animationsEnabled))
  }, [hydrated, animationsEnabled])

  useEffect(() => {
    if (!lottieRef.current) return

    if (!animationsEnabled) {
      lottieRef.current.pause()
      return
    }

    lottieRef.current.play()
    const stateMultiplier = state === 'celebrate' ? 1.1 : state === 'thinking' ? 0.95 : 1
    lottieRef.current.setSpeed(tone.animationSpeed * stateMultiplier)
  }, [animationsEnabled, state, tone.animationSpeed])

  const animationData = state === 'thinking'
    ? thinkingAnimation
    : state === 'celebrate'
      ? celebrateAnimation
      : idleAnimation

  const bubbleMessage = message || buildAssistantMessage({
    assistantName,
    personality,
    event,
    clientName,
  })

  if (hydrated && !isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAnimationsEnabled((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/20 hover:text-foreground"
          aria-label={animationsEnabled ? 'Desactivar animaciones del asistente' : 'Activar animaciones del asistente'}
        >
          <Wand2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsVisible(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg transition hover:border-primary/20 hover:text-primary"
        >
          <Eye className="h-4 w-4" />
          Mostrar {assistantName}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-[220px] flex-col items-end gap-3">
      {!open ? (
        <div className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm ${tone.bubbleClass}`}>
          <p className="text-sm font-semibold">{bubbleMessage}</p>
          <p className={`mt-1 text-xs ${tone.accentClass}`}>
            Método: {methodologySummary}
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAnimationsEnabled((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground transition hover:border-primary/20 hover:text-foreground"
          aria-label={animationsEnabled ? 'Desactivar animaciones del asistente' : 'Activar animaciones del asistente'}
        >
          <Sparkles className={`h-4 w-4 ${animationsEnabled ? 'text-primary' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground transition hover:border-primary/20 hover:text-foreground"
          aria-label="Ocultar asistente"
        >
          <EyeOff className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClick}
          className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-primary/20 bg-card/95 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-primary/40"
          aria-label={open ? `Cerrar chat de ${assistantName}` : `Abrir chat de ${assistantName}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(180deg,rgba(249,115,22,0.18),rgba(15,15,15,0.2))]" />
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={animationsEnabled}
            autoplay={animationsEnabled}
            className="relative z-10 h-20 w-20"
          />
        </button>
      </div>
    </div>
  )
}
