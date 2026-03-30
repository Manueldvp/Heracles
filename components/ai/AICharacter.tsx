'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Minimize2, Sparkles, Volume2 } from 'lucide-react'
import { buildAssistantMessage, getAssistantTone, getMethodologySummary, type AssistantEvent, type AssistantVisualState } from '@/lib/ai-assistant'

type AssistantStateEvent = CustomEvent<{
  state?: AssistantVisualState
  event?: AssistantEvent
  message?: string
}>

type AssistantChatEvent = CustomEvent<{ open?: boolean }>

const STORAGE_KEYS = {
  minimized: 'treinex-assistant-minimized',
  animations: 'treinex-assistant-animations',
} as const

export default function AICharacter({
  assistantName,
  personality = 'Profesional, cercano y claro.',
  methodology = 'Acompañamiento adaptado a tu progreso.',
  hasChat = false,
}: {
  assistantName: string
  personality?: string
  methodology?: string
  hasChat?: boolean
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const [animationData, setAnimationData] = useState<unknown>(null)
  const [state, setState] = useState<AssistantVisualState>('idle')
  const [event, setEvent] = useState<AssistantEvent>('idle')
  const [message, setMessage] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const tone = useMemo(() => getAssistantTone(personality), [personality])
  const methodologySummary = useMemo(() => getMethodologySummary(methodology), [methodology])

  useEffect(() => {
    let mounted = true

    const loadAnimation = async () => {
      try {
        const response = await fetch('/animations/idle.json')
        if (!response.ok) throw new Error('Animation not found')
        const data = await response.json()
        if (mounted) setAnimationData(data)
      } catch {
        if (mounted) setAnimationData(null)
      }
    }

    loadAnimation()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const savedMinimized = localStorage.getItem(STORAGE_KEYS.minimized)
    const savedAnimations = localStorage.getItem(STORAGE_KEYS.animations)
    setMinimized(savedMinimized === 'true')
    setAnimationsEnabled(savedAnimations !== 'false')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.minimized, String(minimized))
  }, [hydrated, minimized])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.animations, String(animationsEnabled))
  }, [hydrated, animationsEnabled])

  useEffect(() => {
    const greetingKey = `treinex-assistant-greeting-${new Date().toDateString()}`
    const initialEvent = localStorage.getItem(greetingKey) === 'seen' ? 'idle' : 'login'
    const initialState: AssistantVisualState = initialEvent === 'login' ? 'greeting' : 'idle'

    setEvent(initialEvent)
    setState(initialState)
    setMessage(buildAssistantMessage({ assistantName, personality, event: initialEvent }))

    if (initialEvent === 'login') {
      localStorage.setItem(greetingKey, 'seen')
      const timer = window.setTimeout(() => setState('idle'), 3200)
      return () => window.clearTimeout(timer)
    }
  }, [assistantName, personality])

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as AssistantStateEvent).detail
      const nextState = detail?.state ?? 'idle'
      const nextEvent = detail?.event ?? 'idle'
      setState(nextState)
      setEvent(nextEvent)
      setMessage(detail?.message || buildAssistantMessage({ assistantName, personality, event: nextEvent }))
    }

    window.addEventListener('treinex:ai-state', handleState as EventListener)
    return () => window.removeEventListener('treinex:ai-state', handleState as EventListener)
  }, [assistantName, personality])

  useEffect(() => {
    const handleChatState = (event: Event) => {
      const detail = (event as AssistantChatEvent).detail
      const isOpen = Boolean(detail?.open)
      setChatOpen(isOpen)
      if (isOpen) {
        setEvent('assistant-open')
        setState('focus')
        setMessage(buildAssistantMessage({ assistantName, personality, event: 'assistant-open' }))
      } else {
        setState('idle')
      }
    }

    window.addEventListener('treinex:ai-chat-state', handleChatState as EventListener)
    return () => window.removeEventListener('treinex:ai-chat-state', handleChatState as EventListener)
  }, [assistantName, personality])

  useEffect(() => {
    const handleWorkout = () => {
      setEvent('workout-complete')
      setState('celebrating')
      setMessage(buildAssistantMessage({ assistantName, personality, event: 'workout-complete' }))
      window.setTimeout(() => setState('idle'), 3400)
    }

    window.addEventListener('treinex:workout-complete', handleWorkout)
    return () => window.removeEventListener('treinex:workout-complete', handleWorkout)
  }, [assistantName, personality])

  useEffect(() => {
    let timeoutId: number | undefined

    const resetInactivity = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (state === 'warning' && !chatOpen) {
        setState('idle')
        setEvent('idle')
      }
      timeoutId = window.setTimeout(() => {
        if (chatOpen) return
        setEvent('inactivity')
        setState('warning')
        setMessage(buildAssistantMessage({ assistantName, personality, event: 'inactivity' }))
      }, 50000)
    }

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach((name) => window.addEventListener(name, resetInactivity))
    resetInactivity()

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      events.forEach((name) => window.removeEventListener(name, resetInactivity))
    }
  }, [assistantName, personality, chatOpen, state])

  useEffect(() => {
    if (!lottieRef.current) return
    if (!animationsEnabled) {
      lottieRef.current.pause()
      return
    }

    lottieRef.current.play()

    const speedByState: Record<AssistantVisualState, number> = {
      idle: 0.9,
      greeting: 1.18,
      thinking: 1.08,
      focus: 0.95,
      motivating: 1.18,
      celebrating: 1.3,
      warning: 0.72,
    }

    lottieRef.current.setSpeed(tone.animationSpeed * speedByState[state])
  }, [state, animationData, tone.animationSpeed, animationsEnabled])

  const handleClick = () => {
    if (hasChat) {
      window.dispatchEvent(new CustomEvent('treinex:toggle-ai-chat', {
        detail: { open: !chatOpen },
      }))
    } else {
      setChatOpen((value) => !value)
    }

    setEvent('assistant-open')
    setState('focus')
    setMessage(buildAssistantMessage({ assistantName, personality, event: 'assistant-open' }))
  }

  const orbAnimate = {
    idle: { y: [0, -5, 0], scale: [1, 1.02, 1], rotate: [0, -1, 1, 0] },
    greeting: { y: [0, -10, 0], scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] },
    thinking: { y: [0, -3, 0], scale: [1, 1.03, 1], rotate: [0, -6, 6, 0] },
    focus: { y: [0, -4, 0], scale: [1, 1.05, 1], rotate: [0, 0, 0] },
    motivating: { y: [0, -8, 0], scale: [1, 1.07, 1], rotate: [0, -3, 3, 0] },
    celebrating: { y: [0, -12, 0], scale: [1, 1.12, 1], rotate: [0, -8, 8, 0] },
    warning: { y: [0, -2, 0], scale: [1, 0.98, 1], rotate: [0, -2, 2, 0] },
  }[state]

  const orbTransition = {
    duration: state === 'warning' ? 2.6 : state === 'celebrating' ? 0.9 : 1.8,
    repeat: Infinity,
    ease: 'easeInOut',
  } as const

  const ringAnimate = {
    idle: { scale: [1, 1.08, 1], opacity: [0.24, 0.34, 0.24] },
    greeting: { scale: [1, 1.14, 1], opacity: [0.3, 0.5, 0.3] },
    thinking: { scale: [1, 1.1, 1], opacity: [0.24, 0.42, 0.24] },
    focus: { scale: [1, 1.1, 1], opacity: [0.32, 0.46, 0.32] },
    motivating: { scale: [1, 1.12, 1], opacity: [0.28, 0.48, 0.28] },
    celebrating: { scale: [1, 1.18, 1], opacity: [0.34, 0.56, 0.34] },
    warning: { scale: [1, 1.04, 1], opacity: [0.18, 0.28, 0.18] },
  }[state]

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[320px] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {!minimized ? (
          <motion.div
            key="assistant-bubble"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="w-[min(300px,calc(100vw-2.5rem))] overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(22,22,22,0.88)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{assistantName}</p>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                    {tone.statusLabel}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {methodologySummary}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAnimationsEnabled((value) => !value)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
                  aria-label={animationsEnabled ? 'Desactivar animaciones' : 'Activar animaciones'}
                >
                  <Volume2 className={`h-3.5 w-3.5 ${animationsEnabled ? 'text-primary' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
                  aria-label="Minimizar asistente"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] bg-white/[0.03] px-4 py-3">
              <p className="text-sm leading-6 text-foreground">{message}</p>
              <p className={`mt-2 text-[11px] uppercase tracking-[0.18em] ${tone.accentClass}`}>
                {state === 'thinking'
                  ? 'Procesando'
                  : state === 'celebrating'
                    ? 'Celebrando'
                    : state === 'warning'
                      ? 'Atento'
                      : event === 'assistant-open'
                        ? 'En foco'
                        : 'Disponible'}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {minimized ? (
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-full border border-white/10 bg-[rgba(22,22,22,0.88)] px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-xl transition hover:border-primary/20 hover:text-primary"
          >
            Mostrar asistente
          </button>
        ) : null}

        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(18,18,18,0.92)] shadow-[0_22px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          aria-label={`Abrir asistente ${assistantName}`}
        >
          <motion.div
            animate={ringAnimate}
            transition={orbTransition}
            className={`absolute inset-2 rounded-[24px] bg-gradient-to-br ${tone.orbClass}`}
          />
          <motion.div
            animate={orbAnimate}
            transition={orbTransition}
            className="relative z-10 flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))] shadow-inner"
          >
            {animationData && animationsEnabled ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop
                autoplay
                className="h-[70px] w-[70px]"
              />
            ) : (
              <motion.div
                animate={orbAnimate}
                transition={orbTransition}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
              >
                <Bot className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </motion.div>
          <div className="absolute bottom-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/45 px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            AI
          </div>
          {state === 'greeting' || state === 'celebrating' || state === 'motivating' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-[30px] bg-primary/10"
            />
          ) : null}
        </motion.button>
      </div>
    </div>
  )
}
