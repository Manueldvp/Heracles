'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, Mic, MicOff } from 'lucide-react'
import AICharacter from '@/components/ai/AICharacter'
import { buildAssistantMessage, getMethodologySummary, type AssistantEvent, type AssistantVisualState } from '@/lib/ai-assistant'

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
  const [characterState, setCharacterState] = useState<AssistantVisualState>('idle')
  const [characterEvent, setCharacterEvent] = useState<AssistantEvent>('idle')
  const [ambientMessage, setAmbientMessage] = useState<string>()
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const greetingKey = `treinex-ai-greeting-${new Date().toDateString()}`

    if (localStorage.getItem(greetingKey) !== 'seen') {
      localStorage.setItem(greetingKey, 'seen')
      setCharacterEvent('login')
      setCharacterState('celebrate')
      setAmbientMessage(buildAssistantMessage({ assistantName, personality, event: 'login', clientName }))
      const timer = window.setTimeout(() => setCharacterState('idle'), 3600)
      return () => window.clearTimeout(timer)
    }

    setAmbientMessage(buildAssistantMessage({ assistantName, personality, event: 'idle', clientName }))
  }, [assistantName, personality, clientName])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    const handleWorkoutComplete = () => {
      setCharacterEvent('workout-complete')
      setCharacterState('celebrate')
      setAmbientMessage(buildAssistantMessage({ assistantName, personality, event: 'workout-complete', clientName }))
      window.setTimeout(() => setCharacterState('idle'), 4200)
    }

    window.addEventListener('treinex:workout-complete', handleWorkoutComplete)
    return () => window.removeEventListener('treinex:workout-complete', handleWorkoutComplete)
  }, [assistantName, personality, clientName])

  useEffect(() => {
    let timeoutId: number | undefined

    const resetInactivityTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        if (open || loading) return
        setCharacterEvent('inactivity')
        setCharacterState('thinking')
        setAmbientMessage(buildAssistantMessage({ assistantName, personality, event: 'inactivity', clientName }))
        window.setTimeout(() => setCharacterState('idle'), 3000)
      }, 45000)
    }

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer))
    resetInactivityTimer()

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer))
    }
  }, [assistantName, personality, clientName, open, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setCharacterEvent('ai-interaction')
    setCharacterState('thinking')
    setAmbientMessage(buildAssistantMessage({ assistantName, personality, event: 'ai-interaction', clientName }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setCharacterState('celebrate')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Lo siento, no pude procesar tu mensaje.',
      }])
      setAmbientMessage(data.message || buildAssistantMessage({ assistantName, personality, event: 'ai-interaction', clientName }))
      setTimeout(() => setCharacterState('idle'), 3000)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error, intenta de nuevo.' }])
      setAmbientMessage(`${assistantName} dice: hubo un problema, pero sigo aquí contigo.`)
      setCharacterState('idle')
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

      <AICharacter
        assistantName={assistantName}
        personality={personality}
        methodology={methodology}
        state={characterState}
        event={characterEvent}
        clientName={clientName}
        open={open}
        onClick={() => setOpen((value) => !value)}
        message={ambientMessage}
      />

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 chat-open"
          style={{ maxHeight: '520px', background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80"
            style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #1c1917 100%)' }}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${loading ? 'border-yellow-400/30 bg-yellow-400/10' : 'border-primary/20 bg-primary/10'}`}>
              <span className="text-lg">{loading ? '...' : 'AI'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{assistantName}</p>
              <p className="text-orange-300/70 text-xs">
                {loading ? 'Pensando...' : getMethodologySummary(methodology)}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: '340px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 msg-animate ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[10px] font-semibold text-primary">{assistantName.charAt(0)}</span>
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/50'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start msg-animate">
                <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{assistantName.charAt(0)}</span>
                </div>
                <div className="bg-zinc-800 border border-zinc-700/50 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800/80 flex gap-2 bg-zinc-950/50">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-zinc-600"
            />
            <button
              onClick={listening ? stopListening : startListening}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {listening ? <MicOff size={15} className="text-white" /> : <Mic size={15} className="text-zinc-400" />}
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
