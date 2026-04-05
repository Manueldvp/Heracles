'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, Loader2, AlertCircle, Star } from 'lucide-react'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface FormDef {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

function FieldInput({ field, value, onChange, hasError }: {
  field: FormField; value: any; onChange: (v: any) => void; hasError: boolean
}) {
  const base = `w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition ${
    hasError ? 'border-red-500/50' : 'border-zinc-700 focus:border-blue-500/50'
  }`

  if (field.type === 'text' || field.type === 'number') {
    return <input type={field.type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} className={base} />
  }
  if (field.type === 'textarea') {
    return <textarea value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} rows={3} className={`${base} resize-none`} />
  }
  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-2">
        {(field.options ?? []).map((opt, i) => (
          <button key={i} type="button" onClick={() => onChange(opt)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition text-left ${
              value === opt ? 'bg-orange-500 border-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              value === opt ? 'border-white/80' : 'border-zinc-600'
            }`}>
              {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            {opt}
          </button>
        ))}
      </div>
    )
  }
  if (field.type === 'multiselect') {
    const selected: string[] = value ?? []
    const toggle = (opt: string) => selected.includes(opt)
      ? onChange(selected.filter(s => s !== opt))
      : onChange([...selected, opt])
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt, i) => (
          <button key={i} type="button" onClick={() => toggle(opt)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm transition ${
              selected.includes(opt) ? 'bg-orange-500 border-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}>
            {selected.includes(opt) && <Check size={11} />}
            {opt}
          </button>
        ))}
      </div>
    )
  }
  if (field.type === 'rating') {
    return (
      <div className="flex gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition ${
              value >= n ? 'bg-orange-500 border-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]'
              : 'bg-zinc-800 border-zinc-700 text-zinc-600 hover:text-zinc-300'
            }`}>
            {n}
          </button>
        ))}
      </div>
    )
  }
  return null
}

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const token = params.token as string

  const [formDef, setFormDef] = useState<FormDef | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errorFields, setErrorFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [noForm, setNoForm] = useState(false)

  useEffect(() => {
    const load = async () => {
      // 1. Verificar sesión
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/login?token=${token}`); return }

      // 2. Vincular user via API (bypasea RLS con admin)
      const res = await fetch('/api/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: user.id, email: user.email }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.redirect === '/client') { router.push('/client'); return }
        setInvalid(true); setLoading(false); return
      }

      const { clientId: cid, formId, form, onboardingCompleted } = await res.json()

      if (onboardingCompleted) { router.push('/client'); return }

      setClientId(cid)

      // 3. Sin formulario → completar directo
      if (!formId) { setNoForm(true); setLoading(false); return }

      if (!form) { setNoForm(true); setLoading(false); return }

      setFormDef(form)
      setLoading(false)
    }
    load()
  }, [token])

  // Sin formulario → completar onboarding directo
  useEffect(() => {
    if (!noForm || !clientId) return
    const complete = async () => {
      await fetch('/api/onboarding-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      router.push('/client')
    }
    complete()
  }, [noForm, clientId])

  const validate = () => {
    if (!formDef) return true
    const missing = formDef.fields
      .filter(f => f.required)
      .filter(f => {
        const v = responses[f.id]
        if (v === undefined || v === null || v === '') return true
        if (Array.isArray(v) && v.length === 0) return true
        return false
      })
      .map(f => f.id)
    setErrorFields(missing)
    return missing.length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !clientId || !formDef) return
    setSubmitting(true)

    // Extraer campos clave del formulario para actualizar el perfil
    const updates: any = {}
    formDef.fields.forEach(f => {
      const val = responses[f.id]
      if (!val) return
      const lbl = f.label.toLowerCase()
      if (lbl.includes('nombre')) updates.full_name = val
      if (lbl.includes('peso') && f.type === 'number') updates.weight = parseFloat(val)
      if (lbl.includes('altura') && f.type === 'number') updates.height = parseFloat(val)
      if (lbl.includes('edad') && f.type === 'number') updates.age = parseInt(val)
      if (lbl.includes('objetivo')) updates.goal = val
    })

    // Usar API admin para actualizar (bypasea RLS)
    await fetch('/api/onboarding-link', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        updates,
        formId: formDef.id,
        responses,
      }),
    })

    setDone(true)
    setSubmitting(false)
    setTimeout(() => router.push('/client'), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 size={28} className="text-orange-400 animate-spin" />
    </div>
  )

  if (invalid) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-white font-bold">Invitación inválida</p>
        <p className="text-zinc-500 text-sm">Este link no es válido o ya fue utilizado.</p>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <Check size={36} className="text-green-400" />
        </div>
        <h2 className="text-white font-bold text-2xl">¡Todo listo!</h2>
        <p className="text-zinc-400 text-sm">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  )

  if (!formDef) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 size={28} className="text-orange-400 animate-spin" />
    </div>
  )

  const completedCount = formDef.fields.filter(f => {
    const v = responses[f.id]
    if (v === undefined || v === null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }).length
  const progress = Math.round((completedCount / formDef.fields.length) * 100)

  return (
    <div className="min-h-screen bg-black px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            className="text-white text-3xl font-bold mb-1">TREINEX</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Cuestionario inicial</p>
          <h2 className="text-white font-bold text-xl">{formDef.title}</h2>
          {formDef.description && <p className="text-zinc-400 text-sm mt-1.5">{formDef.description}</p>}
          <div className="flex items-center gap-3 mt-4 max-w-xs mx-auto">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
            <span className="text-zinc-500 text-xs shrink-0">{completedCount}/{formDef.fields.length}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 mb-8">
          {formDef.fields.map(field => (
            <div key={field.id} className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium flex items-center gap-1.5">
                {field.label}
                {field.required && <span className="text-orange-400">*</span>}
              </label>
              <FieldInput
                field={field}
                value={responses[field.id]}
                onChange={v => {
                  setResponses(prev => ({ ...prev, [field.id]: v }))
                  setErrorFields(prev => prev.filter(id => id !== field.id))
                }}
                hasError={errorFields.includes(field.id)}
              />
              {errorFields.includes(field.id) && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={11} /> Este campo es requerido
                </p>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold gap-2">
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
            : <><Check size={16} /> Completar y entrar al dashboard</>
          }
        </Button>
        <p className="text-zinc-600 text-xs text-center mt-3">
          Tus datos son privados y solo los verá tu entrenador
        </p>
      </div>
    </div>
  )
}
