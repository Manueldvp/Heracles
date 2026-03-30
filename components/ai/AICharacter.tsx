'use client'

import { useEffect, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

type VisualState = 'idle' | 'thinking'

type AssistantStateEvent = CustomEvent<{ state?: VisualState }>

export default function AICharacter({
  assistantName,
}: {
  assistantName: string
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const [animationData, setAnimationData] = useState<unknown>(null)
  const [state, setState] = useState<VisualState>('idle')

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
    const handleState = (event: Event) => {
      const detail = (event as AssistantStateEvent).detail
      setState(detail?.state === 'thinking' ? 'thinking' : 'idle')
    }

    window.addEventListener('treinex:ai-state', handleState as EventListener)
    return () => window.removeEventListener('treinex:ai-state', handleState as EventListener)
  }, [])

  useEffect(() => {
    if (!lottieRef.current) return
    lottieRef.current.play()
    lottieRef.current.setSpeed(state === 'thinking' ? 1.2 : 0.9)
  }, [state, animationData])

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('treinex:toggle-ai-chat'))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="text-sm font-semibold text-foreground">
          {state === 'thinking' ? `${assistantName} está pensando...` : assistantName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {state === 'thinking' ? 'Preparando una respuesta' : 'Asistente activo'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-primary/20 bg-card/95 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-primary/40"
        aria-label={`Abrir asistente ${assistantName}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(180deg,rgba(249,115,22,0.18),rgba(15,15,15,0.2))]" />

        {animationData ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop
            autoplay
            className="relative z-10 h-20 w-20"
          />
        ) : (
          <motion.div
            animate={state === 'thinking'
              ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }
              : { scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: state === 'thinking' ? 0.9 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
          >
            <motion.div
              animate={state === 'thinking'
                ? { rotate: [0, -8, 8, 0] }
                : { y: [0, -3, 0] }}
              transition={{ duration: state === 'thinking' ? 0.8 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20"
            >
              <Bot className="h-5 w-5 text-primary" />
            </motion.div>
          </motion.div>
        )}
      </button>
    </div>
  )
}
