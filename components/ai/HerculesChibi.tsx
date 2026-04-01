'use client'

export type HerculesChibiState = 'idle' | 'thinking' | 'speaking' | 'walking' | 'pushup' | 'warning'

export function HerculesChibiStyles() {
  return (
    <style>{`
      @keyframes hercules-idle {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        30% { transform: translateY(-4px) rotate(-1.2deg); }
        70% { transform: translateY(-1px) rotate(1.2deg); }
      }
      @keyframes hercules-think {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-3px) rotate(-2deg); }
      }
      @keyframes hercules-speak {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-2px) scale(1.02); }
      }
      @keyframes hercules-walk {
        0%, 100% { transform: translateY(0px); }
        25% { transform: translateY(-3px); }
        50% { transform: translateY(0px); }
        75% { transform: translateY(-2px); }
      }
      @keyframes hercules-pushup {
        0%, 100% { transform: translateY(0px) scaleY(1); }
        50% { transform: translateY(5px) scaleY(0.96); }
      }
      @keyframes hercules-warning {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-1px) rotate(-1deg); }
      }
      @keyframes swing-left {
        0%, 100% { transform: rotate(-12deg); transform-origin: 100% 20%; }
        50% { transform: rotate(14deg); transform-origin: 100% 20%; }
      }
      @keyframes swing-right {
        0%, 100% { transform: rotate(14deg); transform-origin: 0% 20%; }
        50% { transform: rotate(-12deg); transform-origin: 0% 20%; }
      }
      @keyframes leg-left {
        0%, 100% { transform: rotate(10deg); transform-origin: 50% 0%; }
        50% { transform: rotate(-14deg); transform-origin: 50% 0%; }
      }
      @keyframes leg-right {
        0%, 100% { transform: rotate(-14deg); transform-origin: 50% 0%; }
        50% { transform: rotate(10deg); transform-origin: 50% 0%; }
      }
      @keyframes push-arm-left {
        0%, 100% { transform: rotate(74deg); transform-origin: 100% 10%; }
        50% { transform: rotate(92deg); transform-origin: 100% 10%; }
      }
      @keyframes push-arm-right {
        0%, 100% { transform: rotate(-74deg); transform-origin: 0% 10%; }
        50% { transform: rotate(-92deg); transform-origin: 0% 10%; }
      }
      @keyframes think-dot {
        0%, 100% { opacity: 0.35; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      @keyframes soft-shadow {
        0%, 100% { transform: scaleX(1); opacity: 0.24; }
        50% { transform: scaleX(0.88); opacity: 0.16; }
      }
    `}</style>
  )
}

export default function HerculesChibi({
  state,
  size = 108,
  onClick,
}: {
  state: HerculesChibiState
  size?: number
  onClick?: () => void
}) {
  const scale = size / 96
  const height = Math.round(118 * scale)

  const wrapperAnimation =
    state === 'walking'
      ? 'animate-[hercules-walk_0.7s_ease-in-out_infinite]'
      : state === 'pushup'
        ? 'animate-[hercules-pushup_0.9s_ease-in-out_infinite]'
        : state === 'speaking'
          ? 'animate-[hercules-speak_0.45s_ease-in-out_infinite]'
          : state === 'warning'
            ? 'animate-[hercules-warning_2.1s_ease-in-out_infinite]'
            : state === 'thinking'
              ? 'animate-[hercules-think_1.8s_ease-in-out_infinite]'
              : 'animate-[hercules-idle_3s_ease-in-out_infinite]'

  const visual = (
    <>
      <div
        className={`absolute inset-x-5 bottom-4 h-20 rounded-full blur-2xl transition-all duration-500 ${
          state === 'thinking'
            ? 'bg-sky-500/18'
            : state === 'warning'
              ? 'bg-orange-400/18'
              : 'bg-orange-500/22'
        }`}
      />

      <svg
        width={size}
        height={height}
        viewBox="0 0 96 118"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 overflow-visible ${wrapperAnimation}`}
        style={{ filter: 'drop-shadow(0 12px 28px rgba(249,115,22,0.22))' }}
      >
        <ellipse
          cx="48"
          cy="112"
          rx="22"
          ry="6"
          fill="rgba(0,0,0,0.22)"
          className={state === 'walking' ? 'animate-[soft-shadow_0.7s_ease-in-out_infinite]' : ''}
        />

        <g className={state === 'walking' ? 'animate-[swing-left_0.7s_ease-in-out_infinite]' : state === 'pushup' ? 'animate-[push-arm-left_0.9s_ease-in-out_infinite]' : ''}>
          <path d="M24 55 C15 59 10 69 14 78 C17 84 25 83 28 77 L34 63 C36 58 32 53 24 55 Z" fill="#D65A0B" />
          <circle cx="20" cy="80" r="7" fill="#FFCA3A" />
        </g>

        <g className={state === 'walking' ? 'animate-[swing-right_0.7s_ease-in-out_infinite]' : state === 'pushup' ? 'animate-[push-arm-right_0.9s_ease-in-out_infinite]' : ''}>
          <path d="M72 55 C81 59 86 69 82 78 C79 84 71 83 68 77 L62 63 C60 58 64 53 72 55 Z" fill="#D65A0B" />
          <circle cx="76" cy="80" r="7" fill="#FFCA3A" />
        </g>

        <g className={state === 'walking' ? 'animate-[leg-left_0.7s_ease-in-out_infinite]' : ''}>
          <path d="M38 83 C33 92 32 103 35 110 L46 110 C46 100 46 92 49 84 Z" fill="#7C2D12" />
          <rect x="33" y="106" width="16" height="8" rx="4" fill="#5B1D0A" />
        </g>

        <g className={state === 'walking' ? 'animate-[leg-right_0.7s_ease-in-out_infinite]' : ''}>
          <path d="M58 83 C63 92 64 103 61 110 L50 110 C50 100 50 92 47 84 Z" fill="#7C2D12" />
          <rect x="47" y="106" width="16" height="8" rx="4" fill="#5B1D0A" />
        </g>

        <path d="M33 49 C33 40 40 34 48 34 C56 34 63 40 63 49 V81 C63 86 59 90 54 90 H42 C37 90 33 86 33 81 V49 Z" fill="#D65A0B" />
        <path d="M38 53 C38 48 42 44 48 44 C54 44 58 48 58 53 V74 C58 78 55 82 50 82 H46 C41 82 38 78 38 74 V53 Z" fill="#F97316" />
        <rect x="42" y="79" width="12" height="10" rx="3" fill="#F59E0B" />

        <path d="M25 26 C25 11 35 4 48 4 C61 4 71 11 71 26 C71 39 61 49 48 49 C35 49 25 39 25 26 Z" fill="#FFD166" />
        <path d="M24 25 C26 12 35 6 48 6 C61 6 70 12 72 25 L68 27 C66 19 59 14 48 14 C37 14 30 19 28 27 Z" fill="#B91C1C" />
        <path d="M26 26 C28 10 38 1 48 1 C58 1 68 10 70 26 L63 25 C61 14 55 9 48 9 C41 9 35 14 33 25 Z" fill="#EF4444" />
        <rect x="44.5" y="1" width="7" height="10" rx="3.5" fill="#EF4444" />
        <path d="M31 21 C35 16 41 14 48 14 C55 14 61 16 65 21 C60 14 55 11 48 11 C41 11 36 14 31 21 Z" fill="#7C2D12" opacity="0.45" />

        <ellipse cx="40" cy="28" rx="7" ry="8" fill="white" />
        <ellipse cx="56" cy="28" rx="7" ry="8" fill="white" />
        {state === 'walking' || state === 'pushup' ? (
          <>
            <text x="36.2" y="31" fontSize="9" fill="#92400E">★</text>
            <text x="52.2" y="31" fontSize="9" fill="#92400E">★</text>
          </>
        ) : (
          <>
            <circle cx="41" cy="29" r="3.2" fill="#2B160B" />
            <circle cx="55" cy="29" r="3.2" fill="#2B160B" />
            <circle cx="42.2" cy="27.8" r="0.9" fill="white" />
            <circle cx="56.2" cy="27.8" r="0.9" fill="white" />
          </>
        )}

        <path d="M35 21 C38 18 42 17 45 18" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        <path d="M51 18 C54 17 58 18 61 21" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
        <circle cx="48" cy="36" r="1.3" fill="#B45309" />
        {state === 'speaking' ? (
          <ellipse cx="48" cy="40.5" rx="6" ry="4.3" fill="#8A3412" />
        ) : state === 'warning' ? (
          <path d="M42 42 C45 38 51 38 54 42" stroke="#8A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M42 39 C45 43 51 43 54 39" stroke="#8A3412" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}

        {state === 'thinking' ? (
          <>
            <circle cx="72" cy="18" r="3" fill="white" opacity="0.92" className="animate-[think-dot_1.5s_ease-in-out_infinite]" />
            <circle cx="80" cy="12" r="4" fill="white" opacity="0.92" className="animate-[think-dot_1.5s_ease-in-out_infinite_0.25s]" />
            <circle cx="88" cy="7" r="5" fill="white" opacity="0.92" className="animate-[think-dot_1.5s_ease-in-out_infinite_0.5s]" />
          </>
        ) : null}
      </svg>
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="relative group focus:outline-none" aria-label="Abrir asistente">
        {visual}
      </button>
    )
  }

  return <div className="relative group">{visual}</div>
}
