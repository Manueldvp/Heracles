'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Zap, Check, Mail } from 'lucide-react'

const benefits = [
  { icon: '⚡', title: 'IA integrada', desc: 'Genera rutinas y planes nutricionales en segundos' },
  { icon: '📊', title: 'Seguimiento real', desc: 'Check-ins semanales y gráficos de progreso' },
  { icon: '💬', title: 'Asistente 24/7', desc: 'Tu mascota Hércules guía a tus clientes' },
  { icon: '🏆', title: 'Resultados', desc: 'Herramientas para entrenadores de élite' },
]

function RegisterForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const isClient = !!token

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Completa todos los campos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: isClient ? 'client' : 'trainer',
        token,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'No se pudo crear la cuenta'); setLoading(false); return }

    // Mostrar pantalla de confirmación
    setRegistered(true)
    setLoading(false)
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['', 'Débil', 'Regular', 'Fuerte']

  // ── Pantalla de confirmación ────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Mail size={32} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-2xl mb-2">Revisa tu email</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Te enviamos un link de confirmación a <span className="text-white font-medium">{email}</span>.
              {isClient
                ? ' Al confirmar serás redirigido al cuestionario inicial.'
                : ' Al confirmar podrás acceder a tu dashboard.'
              }
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-full">
            <p className="text-zinc-500 text-xs">
              ¿No llegó el email? Revisa tu carpeta de spam o{' '}
              <button onClick={() => setRegistered(false)} className="text-orange-400 hover:text-orange-300 transition">
                intenta de nuevo
              </button>
            </p>
          </div>
          <Link href="/login" className="text-zinc-600 text-xs hover:text-zinc-400 transition">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
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
        .diagonal-cut-right { clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%); }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up-1 { animation: slide-up 0.5s ease-out 0.1s both; }
        .slide-up-2 { animation: slide-up 0.5s ease-out 0.2s both; }
        .slide-up-3 { animation: slide-up 0.5s ease-out 0.3s both; }
        .slide-up-4 { animation: slide-up 0.5s ease-out 0.4s both; }
        .slide-up-5 { animation: slide-up 0.5s ease-out 0.5s both; }
        .slide-up-6 { animation: slide-up 0.5s ease-out 0.6s both; }
        @keyframes benefit-in {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
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
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-10 lg:hidden">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="font-display text-3xl text-white tracking-wider">HERACLES</span>
            </div>

            <div className="slide-up-1 mb-8">
              <h1 className="font-display text-4xl text-white tracking-wide mb-1">
                {isClient ? 'CREA TU CUENTA' : 'EMPIEZA HOY'}
              </h1>
              <p className="text-zinc-500 text-sm">
                {isClient
                  ? 'Regístrate para acceder a tu programa de entrenamiento'
                  : 'Crea tu cuenta de entrenador gratis'
                }
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="slide-up-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Nombre completo</Label>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                  className="input-glow bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700 h-12 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors" />
              </div>

              <div className="slide-up-3">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                  className="input-glow bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700 h-12 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors" />
              </div>

              <div className="slide-up-4">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Contraseña</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    placeholder="Mínimo 6 caracteres"
                    className="input-glow bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700 h-12 pr-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                    <span className={`text-xs ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="slide-up-5">
                <Button onClick={handleRegister} disabled={loading}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold tracking-wide transition-all disabled:opacity-50 hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando cuenta...
                    </span>
                  ) : isClient ? 'Crear cuenta' : 'Crear cuenta gratis'}
                </Button>
              </div>

              <div className="slide-up-6 text-center">
                <span className="text-zinc-600 text-xs">¿Ya tienes cuenta? </span>
                <Link href={isClient ? `/login?token=${token}` : '/login'}
                  className="text-xs text-orange-500 hover:text-orange-400 transition">
                  Inicia sesión →
                </Link>
              </div>
            </div>

            <p className="text-zinc-800 text-xs text-center mt-12">© 2026 Heracles · Todos los derechos reservados</p>
          </div>
        </div>

        {!isClient && (
          <div className="hidden lg:flex relative diagonal-cut-right bg-zinc-950 grid-bg w-[48%] shrink-0 flex-col items-center justify-center px-16 py-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)' }} />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-orange-500/40" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-orange-500/20" />
            <div className="relative z-10 max-w-xs">
              <div className="flex items-center gap-3 mb-12">
                <div className="relative pulse-ring w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Zap size={20} className="text-white" fill="white" />
                </div>
                <span className="font-display text-4xl text-white tracking-wider">HERACLES</span>
              </div>
              <h2 className="font-display text-3xl text-white leading-tight tracking-wide mb-3">
                TODO LO QUE<br /><span className="text-orange-500">NECESITAS</span><br />PARA CRECER
              </h2>
              <p className="text-zinc-500 text-sm mb-6">La plataforma completa para entrenadores personales modernos.</p>
              <div className="flex flex-col gap-4">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 group"
                    style={{ animation: `benefit-in 0.5s ease-out ${0.2 + i * 0.1}s both` }}>
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg shrink-0 group-hover:border-orange-500/50 transition-colors">
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{b.title}</p>
                      <p className="text-zinc-600 text-xs">{b.desc}</p>
                    </div>
                    <Check size={14} className="text-orange-500/0 group-hover:text-orange-500/60 transition-colors ml-auto shrink-0" />
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-zinc-800/50 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['EA','MR','KL','JP'].map((initials, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center">
                      <span className="text-zinc-400 text-xs font-medium">{initials[0]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs">+2,400 entrenadores<br /><span className="text-zinc-500">ya confían en Heracles</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
