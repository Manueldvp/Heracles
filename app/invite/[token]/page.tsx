import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getClientByInviteToken } from '@/lib/supabase/rpc'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Clock, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()
  const { data: client } = await getClientByInviteToken<{
    id: string
    email: string | null
    trainer_id: string | null
    form_id: string | null
    onboarding_completed: boolean | null
    invite_token_expires_at: string | null
    status: string | null
  }>(supabase, token)

  if (!client) {
    return <InvalidInvite reason="not_found" />
  }

  // Ya completó el registro
  if (client.status === 'active' || client.onboarding_completed) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/client')
    return <InvalidInvite reason="used" />
  }

  // Link expirado
  if (client.invite_token_expires_at && new Date(client.invite_token_expires_at) < new Date()) {
    return <InvalidInvite reason="expired" />
  }

  // Si ya está logueado, ir directo al onboarding
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/onboarding/${token}`)

  // Datos del entrenador con admin client
  const { data: trainer } = await supabaseAdmin
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', client.trainer_id)
    .single()

  const trainerFirstName = trainer?.full_name?.split(' ')[0] ?? 'Tu entrenador'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Logo */}
        <div className="text-center">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            className="text-white text-4xl font-bold">
            TREINEX
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Plataforma de entrenamiento personalizado</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex flex-col gap-5">

            {/* Trainer info */}
            <div className="flex items-center gap-3 pb-5 border-b border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                {trainer?.avatar_url
                  ? <img src={trainer.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-orange-400 font-bold text-lg">{trainer?.full_name?.charAt(0) ?? '?'}</span>
                }
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Te invita a entrenar</p>
                <p className="text-white font-semibold">{trainer?.full_name ?? 'Tu entrenador'}</p>
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <h2 className="text-white font-bold text-xl">Empieza tu transformación</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {trainerFirstName} te ha invitado a su plataforma de entrenamiento personalizado.
                Crea tu cuenta para acceder a tu rutina, plan de nutrición y seguimiento de progreso.
              </p>
            </div>

            {/* Form notice */}
            {client.form_id && (
              <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-3">
                <Clock size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Después de registrarte completarás un breve cuestionario (~2 min) para que {trainerFirstName} pueda personalizar tu programa.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/register?token=${token}`}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm text-center transition flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Crear mi cuenta
              </Link>
              <Link
                href={`/login?token=${token}`}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm text-center transition"
              >
                Ya tengo cuenta — Iniciar sesión
              </Link>
            </div>

          </CardContent>
        </Card>

        <p className="text-zinc-700 text-xs text-center">
          Este link es personal e intransferible · Expira en 7 días
        </p>

      </div>
    </div>
  )
}

// ─── Invalid states ────────────────────────────────────────────────────────────
function InvalidInvite({ reason }: { reason: 'not_found' | 'used' | 'expired' }) {
  const config = {
    not_found: {
      title: 'Invitación inválida',
      desc: 'Este link no existe o ya fue utilizado.',
      action: null,
    },
    used: {
      title: 'Ya estás registrado',
      desc: 'Esta invitación ya fue usada. Inicia sesión para continuar.',
      action: { label: 'Iniciar sesión', href: '/login' },
    },
    expired: {
      title: 'Invitación expirada',
      desc: 'Este link ya no es válido. Pide a tu entrenador que te envíe uno nuevo.',
      action: null,
    },
  }

  const { title, desc, action } = config[reason]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-sm w-full">
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{title}</h2>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">{desc}</p>
          </div>
          {action && (
            <Link href={action.href}
              className="text-orange-400 text-sm hover:text-orange-300 transition font-medium">
              {action.label} →
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
