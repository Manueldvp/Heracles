'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Minimize2, Volume2 } from 'lucide-react'
import { buildAssistantMessage, getAssistantTone, type AssistantEvent, type AssistantVisualState } from '@/lib/ai-assistant'

type AssistantStateEvent = CustomEvent<{
  state?: AssistantVisualState
  event?: AssistantEvent
  message?: string
}>

const STORAGE_KEYS = {
  minimized: 'treinex-assistant-minimized',
  animations: 'treinex-assistant-animations',
} as const

export default function AICharacter({
  assistantName,
  personality = 'Profesional, cercano y claro.',
}: {
  assistantName: string
  personality?: string
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const [animationData, setAnimationData] = useState<unknown>(null)
  const [state, setState] = useState<AssistantVisualState>('idle')
  const [event, setEvent] = useState<AssistantEvent>('idle')
  const [message, setMessage] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const tone = useMemo(() => getAssistantTone(personality), [personality])

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
    if (!message || minimized) return
    setShowBubble(true)
    const timeout = window.setTimeout(() => setShowBubble(false), event === 'assistant-open' ? 2200 : 3600)
    return () => window.clearTimeout(timeout)
  }, [message, event, minimized])

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
      if (state === 'warning' && !panelOpen) {
        setState('idle')
        setEvent('idle')
      }
      timeoutId = window.setTimeout(() => {
        if (panelOpen) return
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
  }, [assistantName, personality, panelOpen, state])

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
    setPanelOpen((value) => !value)
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {showBubble && !minimized ? (
          <motion.div
            key="assistant-bubble"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="max-w-[190px] rounded-2xl bg-[rgba(22,22,22,0.92)] px-3.5 py-2.5 text-right shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl"
          >
            <p className="text-sm font-semibold text-foreground">{message}</p>
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

        <AnimatePresence>
          {panelOpen && !minimized ? (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex items-center gap-2 rounded-full bg-[rgba(22,22,22,0.92)] px-2.5 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl"
            >
              <span className="px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                {tone.statusLabel}
              </span>
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
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-transparent"
          aria-label={`Abrir asistente ${assistantName}`}
        >
          <motion.div
            animate={ringAnimate}
            transition={orbTransition}
            className={`absolute inset-1 rounded-full bg-gradient-to-br ${tone.orbClass}`}
          />
          <motion.div
            animate={orbAnimate}
            transition={orbTransition}
            className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[rgba(24,24,24,0.18)]"
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
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/20"
              >
                <Bot className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </motion.div>
          <div className="absolute bottom-1 right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/45 px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            {assistantName.charAt(0)}
          </div>
          {state === 'greeting' || state === 'celebrating' || state === 'motivating' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-primary/10"
            />
          ) : null}
        </motion.button>
      </div>
    </div>
  )
}
