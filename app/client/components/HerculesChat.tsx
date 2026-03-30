'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Mic, MicOff, Sparkles, Minimize2 } from 'lucide-react'
import { buildAssistantMessage, getAssistantTone, getMethodologySummary } from '@/lib/ai-assistant'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant({
  clientName,
  assistantName,
  personality,
  methodology,
}: {
  clientName: string
  assistantName: string
  personality: string
  methodology: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: buildAssistantMessage({
        assistantName,
        personality,
        event: 'login',
        clientName,
      }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tone = getAssistantTone(personality)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail
      setOpen((value) => typeof detail?.open === 'boolean' ? detail.open : !value)
    }

    window.addEventListener('treinex:toggle-ai-chat', handleToggle)
    return () => {
      window.removeEventListener('treinex:toggle-ai-chat', handleToggle)
    }
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('treinex:ai-chat-state', { detail: { open } }))
  }, [open])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    window.dispatchEvent(new CustomEvent('treinex:ai-state', {
      detail: {
        state: 'thinking',
        event: 'ai-interaction',
        message: buildAssistantMessage({ assistantName, personality, event: 'ai-interaction', clientName }),
      },
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Lo siento, no pude procesar tu mensaje.',
      }])
      window.dispatchEvent(new CustomEvent('treinex:ai-state', {
        detail: {
          state: 'motivating',
          event: 'ai-interaction',
          message: data.message || buildAssistantMessage({ assistantName, personality, event: 'ai-interaction', clientName }),
        },
      }))
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('treinex:ai-state', { detail: { state: 'idle', event: 'idle' } }))
      }, 2200)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error, intenta de nuevo.' }])
      window.dispatchEvent(new CustomEvent('treinex:ai-state', {
        detail: {
          state: 'warning',
          event: 'inactivity',
          message: `${assistantName} dice: hubo un problema, pero seguimos contigo.`,
        },
      }))
    }
    setLoading(false)
  }

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Usa Chrome para voz.'); return }
    const r = new SR()
    r.lang = 'es-ES'
    r.continuous = false
    r.interimResults = false
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e: any) => sendMessage(e.results[0][0].transcript)
    recognitionRef.current = r
    r.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  return (
    <>
      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .msg-animate { animation: msg-in 0.25s ease-out forwards; }
        @keyframes chat-open {
          from { opacity: 0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        .chat-open { animation: chat-open 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="fixed bottom-24 right-5 z-50 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[rgba(18,18,18,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:right-6"
          >
            <div className="border-b border-white/8 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{assistantName}</p>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                        Activo
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {getMethodologySummary(methodology)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
                  aria-label="Minimizar asistente"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5" style={{ maxHeight: '360px' }}>
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 msg-animate ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-[11px] font-semibold text-primary">
                        {assistantName.charAt(0)}
                      </div>
                    ) : null}

                    <div
                      className={`max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-white/[0.05] text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading ? (
                  <div className="flex items-end gap-2 msg-animate">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-[11px] font-semibold text-primary">
                      {assistantName.charAt(0)}
                    </div>
                    <div className={`rounded-[22px] rounded-bl-md px-4 py-3 ${tone.bubbleClass}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '120ms' }} />
                        <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '240ms' }} />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-white/8 bg-white/[0.02] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2 rounded-[22px] bg-white/[0.04] p-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Escribe tu pregunta..."
                  className="h-11 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                    listening
                      ? 'bg-red-500 text-white'
                      : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
                  }`}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
