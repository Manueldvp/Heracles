'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { UserPlus, Mail, FileText, Check, Loader2, AlertCircle } from 'lucide-react'

interface Form {
  id: string
  title: string
  fields: any[]
}

interface Props {
  onInvited?: () => void
}

export default function InviteClientDialog({ onInvited }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) loadForms()
  }, [open])

  const loadForms = async () => {
    const { data } = await supabase
      .from('forms')
      .select('id, title, fields')
      .order('created_at', { ascending: false })
    setForms(data ?? [])
    // Auto-select first form if available
    if (data && data.length > 0) setSelectedFormId(data[0].id)
  }

  const handleInvite = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Generate unique token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      // Create pending client record
      const { error: clientError } = await supabase.from('clients').insert({
        trainer_id: user.id,
        email: email.trim().toLowerCase(),
        full_name: email.split('@')[0],
        invite_token: token,
        invite_token_expires_at: expiresAt,
        form_id: selectedFormId,
        onboarding_completed: false,
        status: 'pending',
        goal: 'muscle_gain',
        level: 'beginner',
      })

      if (clientError) throw new Error(clientError.message)

      // Get trainer profile for email
      const { data: trainerProfile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const inviteUrl = `${appUrl}/invite/${token}`

      // Send email
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          inviteUrl,
          trainerName: trainerProfile?.full_name ?? 'Tu entrenador',
          hasForm: !!selectedFormId,
        }),
      })

      if (!res.ok) {
        const resData = await res.json()
        throw new Error(resData.error ?? 'Error enviando email')
      }

      setSent(true)
      onInvited?.()
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setEmail('')
        setSelectedFormId(null)
      }, 2500)

    } catch (e: any) {
      setError(e.message ?? 'Error al enviar la invitación')
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) { setError(''); setSent(false); setEmail('') }
    }}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
          <UserPlus size={15} /> Invitar cliente
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Invitar nuevo cliente</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Check size={26} className="text-green-400" />
            </div>
            <p className="text-white font-semibold">Invitación enviada</p>
            <p className="text-zinc-500 text-sm text-center">
              <span className="text-white">{email}</span> recibirá un link para registrarse
              {selectedFormId ? ' y completar el formulario de intake' : ''}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pt-1">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium">Email del cliente</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="cliente@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Form selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium">Formulario de intake</label>
              <p className="text-zinc-600 text-xs -mt-0.5">El cliente lo llenará justo después de registrarse</p>

              {forms.length === 0 ? (
                <div className="bg-zinc-800/60 border border-dashed border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-2">
                  <FileText size={14} className="text-zinc-600" />
                  <span className="text-zinc-500 text-sm">Sin formularios creados</span>
                  <a href="/dashboard/forms" className="text-orange-400 text-xs ml-auto hover:text-orange-300 transition">
                    Crear uno →
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  {/* No form option */}
                  <button
                    onClick={() => setSelectedFormId(null)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition text-left ${
                      selectedFormId === null
                        ? 'bg-zinc-700/60 border-zinc-600 text-white'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedFormId === null ? 'border-orange-400' : 'border-zinc-600'
                    }`}>
                      {selectedFormId === null && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                    </div>
                    <span>Sin formulario</span>
                  </button>

                  {/* Form options */}
                  {forms.map(form => (
                    <button
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition text-left ${
                        selectedFormId === form.id
                          ? 'bg-orange-500/10 border-orange-500/25 text-white'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedFormId === form.id ? 'border-orange-400' : 'border-zinc-600'
                      }`}>
                        {selectedFormId === form.id && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                      </div>
                      <FileText size={13} className="text-blue-400 shrink-0" />
                      <span className="truncate flex-1">{form.title}</span>
                      <Badge className="bg-zinc-700/80 text-zinc-400 border-zinc-600 text-xs shrink-0">
                        {form.fields.length} campos
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 gap-2"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                : <><Mail size={15} /> Enviar invitación</>
              }
            </Button>

            <p className="text-zinc-600 text-xs text-center -mt-2">
              El link expira en 7 días · Solo válido para un registro
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
