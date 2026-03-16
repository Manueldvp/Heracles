'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, Mic, MicOff } from 'lucide-react'
import HerculesMascot, { HerculesStyles } from './HerculesMascot'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type MascotState = 'idle' | 'speaking' | 'thinking' | 'excited'

export default function ChatAssistant({
  clientName,
  assistantName,
}: {
  clientName: string
  assistantName: string
}) {
  const [open, setOpen] = useState(false)
  const [mascotState, setMascotState] = useState<MascotState>('idle')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Ey ${clientName.split(' ')[0]}! 💪 Soy ${assistantName}, tu entrenador virtual. Tu entrenador me configuró con todo tu perfil. ¿Qué necesitas hoy?`,
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
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setMascotState('thinking')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setMascotState('speaking')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Lo siento, no pude procesar tu mensaje.',
      }])
      setTimeout(() => setMascotState('idle'), 3000)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error, intenta de nuevo.' }])
      setMascotState('idle')
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
      <HerculesStyles />

      {/* Floating mascot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Speech bubble when idle */}
        {!open && mascotState === 'idle' && (
          <div className="relative bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-xl rounded-br-none shadow-lg max-w-[160px] text-center msg-animate">
            ¡Pregúntame lo que quieras! 💪
            <div className="absolute -bottom-2 right-3 w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700 rotate-45" />
          </div>
        )}

        <HerculesMascot
          state={mascotState}
          onClick={() => setOpen(o => !o)}
          size={72}
          showBadge={true}
        />
      </div>

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
            <div className="relative shrink-0">
              <svg width="40" height="44" viewBox="0 0 72 80" fill="none">
                <circle cx="36" cy="24" r="16" fill="#FBBF24" />
                <path d="M20 22 Q20 8 36 8 Q52 8 52 22" fill="#DC2626" />
                <rect x="20" y="20" width="32" height="5" rx="2" fill="#B91C1C" />
                <rect x="34" y="2" width="4" height="8" rx="2" fill="#EF4444" />
                <ellipse cx="29" cy="23" rx="3.5" ry="3.5" fill="white" />
                <ellipse cx="43" cy="23" rx="3.5" ry="3.5" fill="white" />
                <circle cx="29.5" cy="23.5" r="2" fill="#1C1917" />
                <circle cx="43.5" cy="23.5" r="2" fill="#1C1917" />
                <circle cx="30" cy="22.5" r="0.7" fill="white" />
                <circle cx="44" cy="22.5" r="0.7" fill="white" />
                <path d="M31 29 Q36 33 41 29" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <rect x="20" y="38" width="32" height="20" rx="8" fill="#C2410C" />
              </svg>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{assistantName}</p>
              <p className="text-orange-300/70 text-xs">{loading ? 'Pensando...' : 'Listo para ayudarte'}</p>
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
                  <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs">⚡</span>
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
                <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center shrink-0">
                  <span className="text-xs">⚡</span>
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