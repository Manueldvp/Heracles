'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Zap } from 'lucide-react'

function HerculesIllustration() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px] mx-auto drop-shadow-2xl">
      <ellipse cx="100" cy="232" rx="55" ry="8" fill="rgba(0,0,0,0.5)" />
      <rect x="62" y="118" width="76" height="72" rx="16" fill="#C2410C" />
      <rect x="74" y="124" width="52" height="36" rx="8" fill="#EA580C" />
      <rect x="62" y="178" width="76" height="10" rx="3" fill="#92400E" />
      <rect x="88" y="176" width="24" height="14" rx="3" fill="#F59E0B" />
      <rect x="94" y="179" width="12" height="8" rx="1" fill="#B45309" />
      <rect x="24" y="112" width="36" height="22" rx="11" fill="#C2410C" />
      <ellipse cx="40" cy="112" rx="14" ry="16" fill="#EA580C" />
      <rect x="14" y="130" width="32" height="26" rx="13" fill="#FBBF24" />
      <rect x="140" y="112" width="36" height="22" rx="11" fill="#C2410C" />
      <ellipse cx="160" cy="112" rx="14" ry="16" fill="#EA580C" />
      <rect x="154" y="130" width="32" height="26" rx="13" fill="#FBBF24" />
      <rect x="66" y="186" width="30" height="38" rx="10" fill="#92400E" />
      <rect x="104" y="186" width="30" height="38" rx="10" fill="#92400E" />
      <rect x="62" y="212" width="36" height="16" rx="8" fill="#1C0A00" />
      <rect x="100" y="212" width="36" height="16" rx="8" fill="#1C0A00" />
      <circle cx="100" cy="72" r="44" fill="#FBBF24" />
      <path d="M56 68 Q56 24 100 24 Q144 24 144 68" fill="#DC2626" />
      <rect x="56" y="60" width="88" height="14" rx="4" fill="#B91C1C" />
      <rect x="92" y="8" width="16" height="22" rx="6" fill="#EF4444" />
      <ellipse cx="100" cy="8" rx="10" ry="6" fill="#F87171" />
      <rect x="50" y="62" width="10" height="20" rx="3" fill="#B91C1C" />
      <rect x="140" y="62" width="10" height="20" rx="3" fill="#B91C1C" />
      <ellipse cx="84" cy="70" rx="9" ry="9" fill="white" />
      <ellipse cx="116" cy="70" rx="9" ry="9" fill="white" />
      <circle cx="86" cy="71" r="5" fill="#1C1917" />
      <circle cx="118" cy="71" r="5" fill="#1C1917" />
      <circle cx="87" cy="69" r="2" fill="white" />
      <circle cx="119" cy="69" r="2" fill="white" />
      <path d="M74 58 Q84 53 94 58" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M106 58 Q116 53 126 58" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M88 86 Q100 94 112 86" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M168 60 L160 78 L166 78 L158 96 L174 74 L167 74 Z" fill="#F59E0B" opacity="0.9" />
      <path d="M26 56 L18 74 L24 74 L16 92 L32 70 L25 70 Z" fill="#F59E0B" opacity="0.6" />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const token = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No se pudo obtener la sesión')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'trainer') {
      router.push('/dashboard')
      return
    }

    if (profile?.role === 'client') {
      router.push(token ? `/onboarding/${token}` : '/client')
      return
    }

    // Fallback para cuentas antiguas sin role en profiles.
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (clientRow) {
      router.push(token ? `/onboarding/${token}` : '/client')
      return
    }

    router.push('/dashboard')
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Ingresa tu email primero'); return }
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}` })
    setResetSent(true)
    setError('')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(249,115,22,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .diagonal-cut { clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%); }
        @keyframes float-hero {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float-hero { animation: float-hero 4s ease-in-out infinite; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up-1 { animation: slide-up 0.5s ease-out 0.1s both; }
        .slide-up-2 { animation: slide-up 0.5s ease-out 0.2s both; }
        .slide-up-3 { animation: slide-up 0.5s ease-out 0.3s both; }
        .slide-up-4 { animation: slide-up 0.5s ease-out 0.4s both; }
        .slide-up-5 { animation: slide-up 0.5s ease-out 0.5s both; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid #f97316;
          animation: pulse-ring 2s ease-out infinite;
        }
        .input-glow:focus { box-shadow: 0 0 0 2px rgba(249,115,22,0.3); }
      `}</style>

      <div className="font-body min-h-screen bg-black flex overflow-hidden">

        {/* LEFT — Hero Panel */}
        <div className="hidden lg:flex relative diagonal-cut bg-zinc-950 grid-bg w-[52%] shrink-0 flex-col items-center justify-center px-12 py-12 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)' }} />
          <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-orange-500/40" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-orange-500/20" />
          <div className="absolute top-24 right-16 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 backdrop-blur-sm">
            <p className="text-orange-400 font-display text-2xl leading-none">2.4K</p>
            <p className="text-zinc-500 text-xs mt-0.5">Atletas activos</p>
          </div>
          <div className="absolute bottom-32 right-12 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 backdrop-blur-sm">
            <p className="text-orange-400 font-display text-2xl leading-none">98%</p>
            <p className="text-zinc-500 text-xs mt-0.5">Satisfacción</p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative pulse-ring w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="font-display text-4xl text-white tracking-wider">HERACLES</span>
            </div>
            <div className="float-hero mb-4 w-64">
              <HerculesIllustration />
            </div>
            <h2 className="font-display text-4xl text-white leading-none tracking-wide mb-3">
              ENTRENA.<br />
              <span className="text-orange-500">SUPERA.</span><br />
              DOMINA.
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              La plataforma que conecta entrenadores de élite con atletas que buscan resultados reales.
            </p>
          </div>
        </div>

        {/* RIGHT — Form Panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-10 lg:hidden">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="font-display text-3xl text-white tracking-wider">HERACLES</span>
            </div>

            <div className="slide-up-1 mb-8">
              <h1 className="font-display text-4xl text-white tracking-wide mb-1">BIENVENIDO</h1>
              <p className="text-zinc-500 text-sm">Ingresa a tu cuenta</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="slide-up-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="tu@email.com"
                  className="input-glow bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700 h-12 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors"
                />
              </div>

              <div className="slide-up-3">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="input-glow bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700 h-12 pr-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {resetSent && (
                <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                  ✓ Revisa tu email para restablecer tu contraseña
                </p>
              )}

              <div className="slide-up-4">
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold tracking-wide transition-all disabled:opacity-50 hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ingresando...
                    </span>
                  ) : 'Ingresar'}
                </Button>
              </div>

              <div className="slide-up-5 flex items-center justify-between pt-1">
                <button
                  onClick={handleForgotPassword}
                  className="text-zinc-600 text-xs hover:text-orange-500 transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <Link href={token ? `/register?token=${token}` : '/register'} className="text-xs text-zinc-500 hover:text-orange-400 transition">
                  Crear cuenta →
                </Link>
              </div>
            </div>

            <p className="text-zinc-800 text-xs text-center mt-12">
              © 2026 Heracles · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </>
  )
}



export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
