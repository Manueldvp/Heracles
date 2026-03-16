'use client'

type MascotState = 'idle' | 'speaking' | 'thinking' | 'excited'

export function HerculesStyles() {
  return (
    <style>{`
      @keyframes hercules-idle {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(-4px) rotate(-1deg); }
        75% { transform: translateY(-2px) rotate(1deg); }
      }
      @keyframes hercules-speak {
        0%, 100% { transform: translateY(0px) scaleY(1); }
        50% { transform: translateY(-3px) scaleY(1.03); }
      }
      @keyframes hercules-excited {
        0%, 100% { transform: translateY(0px) rotate(-3deg) scale(1); }
        50% { transform: translateY(-8px) rotate(3deg) scale(1.05); }
      }
      @keyframes hercules-think {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-3px) rotate(-3deg); }
      }
      @keyframes arm-left {
        0%, 100% { transform: rotate(0deg); transform-origin: right center; }
        50% { transform: rotate(-15deg); transform-origin: right center; }
      }
      @keyframes arm-right {
        0%, 100% { transform: rotate(0deg); transform-origin: left center; }
        50% { transform: rotate(15deg); transform-origin: left center; }
      }
      @keyframes mouth-talk {
        0%, 100% { ry: 2; }
        50% { ry: 4; }
      }
      @keyframes think-dot {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
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
  )
}

export default function HerculesMascot({
  state,
  onClick,
  size = 72,
  showBadge = true,
}: {
  state: MascotState
  onClick?: () => void
  size?: number
  showBadge?: boolean
}) {
  const scale = size / 72
  const height = Math.round(80 * scale)

  const svgContent = (
    <>
      <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
        state === 'speaking' ? 'bg-orange-500/60 scale-125' :
        state === 'excited' ? 'bg-yellow-500/60 scale-150' :
        state === 'thinking' ? 'bg-blue-500/30 scale-110' :
        'bg-orange-500/20 scale-100 group-hover:scale-125 group-hover:bg-orange-500/40'
      }`} />

      <svg
        width={size}
        height={height}
        viewBox="0 0 72 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 drop-shadow-2xl transition-transform duration-300 ${
          state === 'idle' ? 'animate-[hercules-idle_3s_ease-in-out_infinite]' :
          state === 'speaking' ? 'animate-[hercules-speak_0.4s_ease-in-out_infinite]' :
          state === 'excited' ? 'animate-[hercules-excited_0.3s_ease-in-out_infinite]' :
          'animate-[hercules-think_2s_ease-in-out_infinite]'
        }`}
        style={{ filter: 'drop-shadow(0 4px 24px rgba(249,115,22,0.4))' }}
      >
        <ellipse cx="36" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.3)" />
        <rect x="20" y="38" width="32" height="28" rx="8" fill="#C2410C" />
        <rect x="26" y="42" width="20" height="14" rx="4" fill="#EA580C" />
        <rect x="20" y="57" width="32" height="5" rx="2" fill="#92400E" />
        <rect x="32" y="56" width="8" height="7" rx="1" fill="#F59E0B" />
        <g className={state === 'speaking' || state === 'excited' ? 'animate-[arm-left_0.4s_ease-in-out_infinite]' : ''}>
          <rect x="5" y="36" width="14" height="10" rx="5" fill="#C2410C" />
          <rect x="3" y="44" width="12" height="10" rx="5" fill="#FBBF24" />
          <ellipse cx="12" cy="36" rx="5" ry="6" fill="#EA580C" />
        </g>
        <g className={state === 'speaking' || state === 'excited' ? 'animate-[arm-right_0.4s_ease-in-out_infinite_0.2s]' : ''}>
          <rect x="53" y="36" width="14" height="10" rx="5" fill="#C2410C" />
          <rect x="57" y="44" width="12" height="10" rx="5" fill="#FBBF24" />
          <ellipse cx="60" cy="36" rx="5" ry="6" fill="#EA580C" />
        </g>
        <rect x="22" y="63" width="12" height="14" rx="4" fill="#92400E" />
        <rect x="38" y="63" width="12" height="14" rx="4" fill="#92400E" />
        <rect x="20" y="72" width="14" height="6" rx="3" fill="#451A03" />
        <rect x="36" y="72" width="14" height="6" rx="3" fill="#451A03" />
        <circle cx="36" cy="24" r="16" fill="#FBBF24" />
        <path d="M20 22 Q20 8 36 8 Q52 8 52 22" fill="#DC2626" />
        <rect x="20" y="20" width="32" height="5" rx="2" fill="#B91C1C" />
        <path d="M33 8 Q36 2 39 8" fill="#EF4444" strokeWidth="0" />
        <rect x="34" y="2" width="4" height="8" rx="2" fill="#EF4444" />

        {state === 'thinking' ? (
          <>
            <ellipse cx="29" cy="23" rx="3" ry="3" fill="white" />
            <ellipse cx="43" cy="21" rx="3" ry="3" fill="white" />
            <circle cx="29" cy="23" r="1.5" fill="#1C1917" />
            <circle cx="43" cy="22" r="1.5" fill="#1C1917" />
            <circle cx="52" cy="12" r="2" fill="white" opacity="0.9" className="animate-[think-dot_1.5s_ease-in-out_infinite]" />
            <circle cx="57" cy="8" r="2.5" fill="white" opacity="0.9" className="animate-[think-dot_1.5s_ease-in-out_infinite_0.3s]" />
            <circle cx="62" cy="5" r="3" fill="white" opacity="0.9" className="animate-[think-dot_1.5s_ease-in-out_infinite_0.6s]" />
          </>
        ) : state === 'excited' ? (
          <>
            <ellipse cx="29" cy="23" rx="4" ry="4" fill="white" />
            <ellipse cx="43" cy="23" rx="4" ry="4" fill="white" />
            <text x="25" y="27" fontSize="6" fill="#F59E0B">★</text>
            <text x="39" y="27" fontSize="6" fill="#F59E0B">★</text>
          </>
        ) : (
          <>
            <ellipse cx="29" cy="23" rx="3.5" ry="3.5" fill="white" />
            <ellipse cx="43" cy="23" rx="3.5" ry="3.5" fill="white" />
            <circle cx="29.5" cy="23.5" r="2" fill="#1C1917" />
            <circle cx="43.5" cy="23.5" r="2" fill="#1C1917" />
            <circle cx="30" cy="22.5" r="0.7" fill="white" />
            <circle cx="44" cy="22.5" r="0.7" fill="white" />
          </>
        )}

        <path d="M25 18 Q29 16 33 18" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M39 18 Q43 16 47 18" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {state === 'speaking' ? (
          <ellipse cx="36" cy="30" rx="4" ry="3" fill="#92400E" className="animate-[mouth-talk_0.3s_ease-in-out_infinite]" />
        ) : state === 'excited' ? (
          <path d="M30 29 Q36 35 42 29" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M31 29 Q36 33 41 29" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        )}
        <path d="M30 32 Q36 35 42 32" stroke="#92400E" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>

      {showBadge && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="relative group focus:outline-none" aria-label="Abrir asistente">
        {svgContent}
      </button>
    )
  }

  return <div className="relative group">{svgContent}</div>
}