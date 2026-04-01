'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCircle, Send, Sparkles } from 'lucide-react'
import AssistantBubble from '@/components/ai/AssistantBubble'
import {
  buildAssistantMessage,
  getAssistantTone,
  getAutonomousAssistantMessages,
  sanitizeAssistantSurfaceText,
  type AssistantEvent,
  type AssistantVisualState,
} from '@/lib/ai-assistant'

type AssistantState = 'idle' | 'talking' | 'motivating' | 'thinking' | 'celebrating'
type CharacterPreference = 'male' | 'female'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AssistantStateEvent = CustomEvent<{
  state?: AssistantVisualState
  event?: AssistantEvent
  message?: string
}>

const STORAGE_KEYS = {
  chat: 'treinex-assistant-chat-history',
} as const

const CHARACTER_ASSETS: Record<CharacterPreference, string> = {
  male: '/ai/male.png',
  female: '/ai/female.png',
}

const SPRING = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
} as const

const KEYFRAME_TWEEN = {
  type: 'tween',
  duration: 0.45,
  ease: 'easeInOut',
} as const

function toAssistantState(nextState?: AssistantVisualState, nextEvent?: AssistantEvent): AssistantState {
  if (nextState === 'celebrating' || nextEvent === 'workout-complete') return 'celebrating'
  if (nextState === 'thinking') return 'thinking'
  if (nextState === 'motivating' || nextState === 'warning' || nextEvent === 'inactivity') return 'motivating'
  if (nextState === 'talking' || nextState === 'focus' || nextEvent === 'ai-interaction') return 'talking'
  return 'idle'
}

export default function AssistantCharacter({
  assistantName,
  personality = 'Profesional, cercano y claro.',
  canAsk = false,
  characterPreference = 'male',
  connectionValid = true,
  onCharacterChange,
}: {
  assistantName: string
  personality?: string
  canAsk?: boolean
  characterPreference?: CharacterPreference
  connectionValid?: boolean
  onCharacterChange?: (next: CharacterPreference) => Promise<void> | void
}) {
  const [assistantState, setAssistantState] = useState<AssistantState>('idle')
  const [panelOpen, setPanelOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [bubbleMessage, setBubbleMessage] = useState('')
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterPreference>(characterPreference)
  const [savingCharacter, setSavingCharacter] = useState(false)
  const tone = useMemo(() => getAssistantTone(personality), [personality])
  const autonomousMessages = useMemo(() => getAutonomousAssistantMessages(personality), [personality])
  const autonomousIntervalMs = useMemo(
    () => (8 + Math.floor(Math.random() * 5)) * 60 * 1000,
    []
  )
  const dismissTimeoutRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const characterButtonRef = useRef<HTMLButtonElement | null>(null)

  const showBubble = useCallback((message: string) => {
    const cleanMessage = sanitizeAssistantSurfaceText(message)
    setBubbleMessage(cleanMessage)
    setBubbleVisible(true)

    if (dismissTimeoutRef.current) {
      window.clearTimeout(dismissTimeoutRef.current)
    }

    dismissTimeoutRef.current = window.setTimeout(() => {
      setBubbleVisible(false)
    }, 4800)
  }, [])

  const setSurfaceReaction = useCallback((nextState: AssistantState, nextMessage?: string) => {
    setAssistantState(nextState)
    if (nextMessage) showBubble(nextMessage)

    if (nextState !== 'idle') {
      window.setTimeout(() => setAssistantState('idle'), nextState === 'celebrating' ? 3200 : 2200)
    }
  }, [showBubble])

  const appendChatMessage = useCallback((role: ChatMessage['role'], content: string) => {
    const cleanContent = sanitizeAssistantSurfaceText(content)

    setChatMessages((current) => {
      const next = [...current, {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content: cleanContent,
      }].slice(-10)

      sessionStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    setSelectedCharacter(characterPreference)
  }, [characterPreference])

  useEffect(() => {
    if (!connectionValid) return

    const syncFromStorage = () => {
      const savedChat = sessionStorage.getItem(STORAGE_KEYS.chat)

      if (savedChat) {
        try {
          setChatMessages(JSON.parse(savedChat) as ChatMessage[])
        } catch {
          sessionStorage.removeItem(STORAGE_KEYS.chat)
        }
      }
    }

    const timer = window.setTimeout(syncFromStorage, 0)
    return () => window.clearTimeout(timer)
  }, [connectionValid])

  useEffect(() => {
    if (!connectionValid) return

    const greetingKey = `treinex-assistant-greeting-${new Date().toDateString()}`
    const hasSeenGreeting = localStorage.getItem(greetingKey) === 'seen'

    if (hasSeenGreeting) return

    const timer = window.setTimeout(() => {
      localStorage.setItem(greetingKey, 'seen')
      setSurfaceReaction('talking', buildAssistantMessage({ assistantName, personality, event: 'login' }))
    }, 600)

    return () => window.clearTimeout(timer)
  }, [assistantName, connectionValid, personality, setSurfaceReaction])

  useEffect(() => {
    if (!connectionValid) return

    const handleState = (eventData: Event) => {
      const detail = (eventData as AssistantStateEvent).detail
      const nextEvent = detail?.event ?? 'idle'
      const nextState = toAssistantState(detail?.state, nextEvent)
      const nextMessage = detail?.message || buildAssistantMessage({ assistantName, personality, event: nextEvent })
      setSurfaceReaction(nextState, nextMessage)
    }

    const handleWorkout = () => {
      setSurfaceReaction('celebrating', buildAssistantMessage({
        assistantName,
        personality,
        event: 'workout-complete',
      }))
    }

    window.addEventListener('treinex:ai-state', handleState as EventListener)
    window.addEventListener('treinex:workout-complete', handleWorkout)

    return () => {
      window.removeEventListener('treinex:ai-state', handleState as EventListener)
      window.removeEventListener('treinex:workout-complete', handleWorkout)
    }
  }, [assistantName, connectionValid, personality, setSurfaceReaction])

  useEffect(() => {
    if (!connectionValid || panelOpen) return

    let inactivityTimeout: number | undefined

    const resetInactivity = () => {
      if (inactivityTimeout) window.clearTimeout(inactivityTimeout)
      inactivityTimeout = window.setTimeout(() => {
        setSurfaceReaction('motivating', buildAssistantMessage({
          assistantName,
          personality,
          event: 'inactivity',
        }))
      }, 50000)
    }

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach((name) => window.addEventListener(name, resetInactivity))
    resetInactivity()

    return () => {
      if (inactivityTimeout) window.clearTimeout(inactivityTimeout)
      events.forEach((name) => window.removeEventListener(name, resetInactivity))
    }
  }, [assistantName, connectionValid, panelOpen, personality, setSurfaceReaction])

  useEffect(() => {
    if (!connectionValid || panelOpen) return

    const interval = window.setInterval(() => {
      const randomMessage = autonomousMessages[Math.floor(Math.random() * autonomousMessages.length)]
      setSurfaceReaction('motivating', randomMessage)
    }, autonomousIntervalMs)

    return () => window.clearInterval(interval)
  }, [autonomousIntervalMs, autonomousMessages, connectionValid, panelOpen, setSurfaceReaction])

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        window.clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, panelOpen])

  useEffect(() => {
    if (!panelOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null

      if (!target) return
      if (panelRef.current?.contains(target)) return
      if (characterButtonRef.current?.contains(target)) return

      setPanelOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [panelOpen])

  const handleAsk = useCallback(async () => {
    if (!question.trim()) return

    const userQuestion = question.trim()
    setAsking(true)
    appendChatMessage('user', userQuestion)
    setQuestion('')
    setBubbleVisible(false)
    setAssistantState('thinking')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuestion }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible responder.')
      }

      const assistantReply = sanitizeAssistantSurfaceText(data.message || 'Seguimos. Dime que necesitas.')
      appendChatMessage('assistant', assistantReply)
      setAssistantState('talking')
      window.setTimeout(() => setAssistantState('idle'), 2200)
    } catch {
      const fallback = 'Se corto un momento. Intenta otra vez y seguimos.'
      appendChatMessage('assistant', fallback)
      setAssistantState('motivating')
      window.setTimeout(() => setAssistantState('idle'), 2200)
    } finally {
      setAsking(false)
    }
  }, [appendChatMessage, question])

  const handlePanelToggle = useCallback(() => {
    setPanelOpen((current) => !current)
  }, [])

  const handleCharacterToggle = useCallback(async () => {
    const next = selectedCharacter === 'male' ? 'female' : 'male'
    setSelectedCharacter(next)
    setSavingCharacter(true)

    try {
      if (onCharacterChange) {
        await onCharacterChange(next)
      } else {
        const response = await fetch('/api/assistant-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: next }),
        })

        if (!response.ok) {
          throw new Error('No fue posible guardar el personaje.')
        }
      }
    } catch {
      setSelectedCharacter(characterPreference)
    } finally {
      setSavingCharacter(false)
    }
  }, [characterPreference, onCharacterChange, selectedCharacter])

  const characterMotion = useMemo(() => {
    if (assistantState === 'talking') {
      return {
        y: -8,
        scale: tone.bounceScale,
        rotate: [0, -2, 2, -1, 0],
      }
    }

    if (assistantState === 'motivating') {
      return {
        y: -10,
        scale: 1.08,
        rotate: tone.variant === 'aggressive' ? 4 : 2,
      }
    }

    if (assistantState === 'celebrating') {
      return {
        y: -18,
        scale: 1.12,
        rotate: [0, -4, 4, 0],
      }
    }

    if (assistantState === 'thinking') {
      return {
        y: -5,
        scale: 1.02,
        rotate: -4,
      }
    }

    return {
      y: 0,
      scale: 1,
      rotate: 0,
    }
  }, [assistantState, tone.bounceScale, tone.variant])

  const bubbleGlowClass = useMemo(() => (
    assistantState === 'celebrating'
      ? 'opacity-80 scale-110'
      : assistantState === 'motivating'
        ? 'opacity-70 scale-105'
        : 'opacity-55 scale-100'
  ), [assistantState])

  if (!connectionValid) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AssistantBubble message={bubbleMessage} visible={bubbleVisible} />

      <div className="flex items-end gap-3">
        <AnimatePresence>
          {panelOpen ? (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, x: 12, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.96 }}
              transition={SPRING}
              className="pointer-events-auto flex h-[min(70vh,560px)] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,29,35,0.96),rgba(11,12,15,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
            >
              <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.16),transparent_58%)] px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-white">{assistantName}</span>
                  <button
                    type="button"
                    onClick={handleCharacterToggle}
                    disabled={savingCharacter}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/75 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-50"
                    aria-label="Cambiar personaje"
                  >
                    {savingCharacter ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {canAsk ? (
                <>
                  <div
                    className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12 [&::-webkit-scrollbar-track]:bg-transparent"
                    style={{ scrollbarGutter: 'stable' }}
                  >
                    <div
                      className="flex min-h-full flex-col justify-end gap-2 pr-1"
                    >
                      {chatMessages.length ? (
                        chatMessages.map((entry) => (
                          <div
                            key={entry.id}
                            className={entry.role === 'assistant'
                              ? 'max-w-[92%] break-words whitespace-pre-wrap rounded-3xl rounded-bl-lg border border-orange-400/15 bg-orange-500/10 px-3.5 py-2.5 text-sm leading-5 text-white/95'
                              : 'ml-auto max-w-[88%] break-words whitespace-pre-wrap rounded-3xl rounded-br-lg border border-white/8 bg-white/[0.07] px-3.5 py-2.5 text-sm leading-5 text-white/90'}
                          >
                            {entry.content}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-sm text-white/60">
                          Escribe algo y seguimos desde aqui.
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="border-t border-white/8 p-3">
                    <div className="flex items-center gap-2 rounded-[24px] border border-white/8 bg-black/20 p-1.5">
                      <input
                        value={question}
                        onChange={(eventData) => setQuestion(eventData.target.value)}
                        onKeyDown={(eventData) => eventData.key === 'Enter' && handleAsk()}
                        placeholder={`Habla con ${assistantName}`}
                        className="h-10 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAsk}
                        disabled={asking || !question.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-400 disabled:opacity-40"
                        aria-label="Enviar mensaje"
                      >
                        {asking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={characterButtonRef}
          type="button"
          onClick={handlePanelToggle}
          whileHover={{ scale: tone.hoverScale, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="pointer-events-auto group relative flex h-[176px] w-[140px] items-end justify-center bg-transparent"
          aria-label={assistantName}
        >
          <motion.div
            animate={{
              scale: assistantState === 'idle' ? [1, 1.05, 1] : 1,
              y: assistantState === 'idle' ? [0, -6, 0] : 0,
            }}
            transition={{
              duration: 3.2,
              repeat: assistantState === 'idle' ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className="relative z-10 origin-bottom"
          >
            <motion.div
              animate={characterMotion}
              transition={
                Array.isArray(characterMotion.rotate) || Array.isArray(characterMotion.y)
                  ? KEYFRAME_TWEEN
                  : SPRING
              }
              className="relative"
            >
              <div className={`absolute inset-x-6 bottom-4 h-20 rounded-full bg-orange-400/20 blur-2xl transition-all duration-300 ${bubbleGlowClass}`} />
              <Image
                src={CHARACTER_ASSETS[selectedCharacter]}
                alt={assistantName}
                width={154}
                height={154}
                priority
                className="relative h-[160px] w-auto select-none object-contain drop-shadow-[0_16px_26px_rgba(0,0,0,0.42)]"
                draggable={false}
              />
              <motion.div
                animate={{
                  scale: assistantState === 'celebrating' ? [1, 1.16, 1] : [1, 1.03, 1],
                  opacity: assistantState === 'celebrating' ? [0.3, 0.75, 0.3] : [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: assistantState === 'celebrating' ? 0.9 : 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute bottom-4 left-1/2 h-[92px] w-[108px] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-orange-500/35 via-orange-300/20 to-transparent blur-xl ${tone.glowClass}`}
              />
            </motion.div>
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.3, 0.45, 0.3],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-3 h-[22px] w-[98px] rounded-full bg-black/30 blur-md"
          />
        </motion.button>
      </div>
    </div>
  )
}
