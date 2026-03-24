'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const PAIN_ZONES = ['Cuello', 'Hombros', 'Espalda alta', 'Espalda baja', 'Cadera', 'Rodillas', 'Tobillos']
const SCALE = [1, 2, 3, 4, 5]

type CheckinType = 'daily' | 'weekly'

type FormState = {
  mood: number
  energy_level: number
  sleep_quality: number
  completed_workouts: number
  adherence: number
  water_liters: string
  calories_consumed: string
  notes: string
  pain_zones: string[]
  stress_level: number
  nutrition_adherence: number
  weight: string
}

function ScaleSelector({
  label,
  helper,
  value,
  onChange,
}: {
  label: string
  helper?: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {helper && <p className="text-xs text-zinc-500 mt-1">{helper}</p>}
        </div>
        <span className="text-sm font-semibold text-white">{value}/5</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {SCALE.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl border px-3 py-3 text-sm transition ${
              value === option
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs transition ${
      active ? 'border-orange-500 bg-orange-500 text-white' :
      done ? 'border-zinc-700 bg-zinc-900 text-zinc-200' :
      'border-zinc-800 bg-zinc-950 text-zinc-500'
    }`}>
      {label}
    </div>
  )
}

function CheckinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [step, setStep] = useState(0)

  const typeParam = searchParams.get('type')
  const [checkinType, setCheckinType] = useState<CheckinType>(typeParam === 'weekly' ? 'weekly' : 'daily')

  const [form, setForm] = useState<FormState>({
    mood: 3,
    energy_level: 3,
    sleep_quality: 3,
    completed_workouts: 0,
    adherence: 3,
    water_liters: '',
    calories_consumed: '',
    notes: '',
    pain_zones: [],
    stress_level: 3,
    nutrition_adherence: 3,
    weight: '',
  })

  const steps = useMemo(() => (
    checkinType === 'daily'
      ? ['Estado general', 'Cumplimiento', 'Notas']
      : ['Estado general', 'Semana', 'Foto', 'Notas']
  ), [checkinType])

  const togglePainZone = (zone: string) => {
    setForm(current => ({
      ...current,
      pain_zones: current.pain_zones.includes(zone)
        ? current.pain_zones.filter(item => item !== zone)
        : [...current.pain_zones, zone],
    }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setError('')
    setPhotoPreview(URL.createObjectURL(file))

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      body.append('folder', 'treinex/checkins')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body }
      )
      const data = await response.json()
      setPhotoUrl(data.secure_url)
    } catch {
      setError('No se pudo subir la imagen. Intenta de nuevo.')
      setPhotoPreview(null)
      setPhotoUrl(null)
    }

    setUploadingPhoto(false)
  }

  const validateCurrentStep = () => {
    if (step === 0) {
      return form.mood > 0 && form.energy_level > 0 && form.sleep_quality > 0
    }
    if (step === 1) {
      if (checkinType === 'daily') {
        return form.adherence > 0
      }
      return form.nutrition_adherence > 0 && form.stress_level > 0
    }
    return true
  }

  const goNext = () => {
    if (!validateCurrentStep()) {
      setError('Completa este paso antes de continuar.')
      return
    }
    setError('')
    setStep(current => Math.min(current + 1, steps.length - 1))
  }

  const goBack = () => {
    setError('')
    setStep(current => Math.max(current - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setError('Completa la información requerida antes de enviar.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Debes iniciar sesión nuevamente.')
      setLoading(false)
      return
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id, trainer_id, full_name')
      .eq('user_id', user.id)
      .single()

    if (!client) {
      setError('No se encontró tu perfil.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('checkins').insert({
      client_id: client.id,
      type: checkinType,
      mood: form.mood,
      energy_level: form.energy_level,
      sleep_quality: form.sleep_quality,
      completed_workouts: form.completed_workouts,
      water_liters: form.water_liters ? parseFloat(form.water_liters) : null,
      calories_consumed: form.calories_consumed ? parseInt(form.calories_consumed, 10) : null,
      notes: form.notes.trim() || null,
      pain_zones: form.pain_zones,
      stress_level: checkinType === 'weekly' ? form.stress_level : null,
      nutrition_adherence: checkinType === 'weekly' ? form.nutrition_adherence : form.adherence,
      weight: checkinType === 'weekly' && form.weight ? parseFloat(form.weight) : null,
      photo_url: checkinType === 'weekly' ? photoUrl : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await fetch('/api/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, checkinType }),
    })

    router.push('/client')
  }

  const renderDailyStep = () => {
    if (step === 0) {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Cómo te sentiste hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Estado de ánimo" value={form.mood} onChange={value => setForm(current => ({ ...current, mood: value }))} />
            <ScaleSelector label="Nivel de energía" helper="1 = muy bajo, 5 = muy alto" value={form.energy_level} onChange={value => setForm(current => ({ ...current, energy_level: value }))} />
            <ScaleSelector label="Calidad del sueño" helper="1 = mala, 5 = excelente" value={form.sleep_quality} onChange={value => setForm(current => ({ ...current, sleep_quality: value }))} />
          </CardContent>
        </Card>
      )
    }

    if (step === 1) {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Cumplimiento del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Adherencia al plan" helper="Qué tan bien cumpliste con lo planificado hoy" value={form.adherence} onChange={value => setForm(current => ({ ...current, adherence: value }))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Entrenos</Label>
                <Input type="number" min={0} max={7} value={form.completed_workouts} onChange={event => setForm(current => ({ ...current, completed_workouts: Math.max(0, parseInt(event.target.value || '0', 10)) }))} className="bg-zinc-950 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Agua</Label>
                <Input type="number" step="0.5" value={form.water_liters} onChange={event => setForm(current => ({ ...current, water_liters: event.target.value }))} placeholder="2.5" className="bg-zinc-950 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Calorías</Label>
                <Input type="number" value={form.calories_consumed} onChange={event => setForm(current => ({ ...current, calories_consumed: event.target.value }))} placeholder="2100" className="bg-zinc-950 border-zinc-800 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Notas opcionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Molestias o dolor</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_ZONES.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => togglePainZone(zone)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    form.pain_zones.includes(zone)
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Notas</Label>
            <textarea
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Cuéntale a tu entrenador cómo estuvo el día o si necesitas ajustar algo."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWeeklyStep = () => {
    if (step === 0) {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Resumen de la semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Estado de ánimo" value={form.mood} onChange={value => setForm(current => ({ ...current, mood: value }))} />
            <ScaleSelector label="Energía general" value={form.energy_level} onChange={value => setForm(current => ({ ...current, energy_level: value }))} />
            <ScaleSelector label="Sueño promedio" value={form.sleep_quality} onChange={value => setForm(current => ({ ...current, sleep_quality: value }))} />
          </CardContent>
        </Card>
      )
    }

    if (step === 1) {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Cumplimiento semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Adherencia nutricional" value={form.nutrition_adherence} onChange={value => setForm(current => ({ ...current, nutrition_adherence: value }))} />
            <ScaleSelector label="Nivel de estrés" value={form.stress_level} onChange={value => setForm(current => ({ ...current, stress_level: value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Peso actual</Label>
                <Input type="number" step="0.1" value={form.weight} onChange={event => setForm(current => ({ ...current, weight: event.target.value }))} placeholder="75.5" className="bg-zinc-950 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Entrenos</Label>
                <Input type="number" min={0} max={14} value={form.completed_workouts} onChange={event => setForm(current => ({ ...current, completed_workouts: Math.max(0, parseInt(event.target.value || '0', 10)) }))} className="bg-zinc-950 border-zinc-800 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (step === 2) {
      return (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Foto de progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoPreview ? (
              <div className="space-y-3">
                <button type="button" onClick={() => setShowPhotoModal(true)} className="block w-full overflow-hidden rounded-2xl border border-zinc-800">
                  <img src={photoPreview} alt="Vista previa" className="h-[320px] w-full object-cover" />
                </button>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">{uploadingPhoto ? 'Subiendo imagen...' : 'Imagen lista para enviar'}</p>
                  <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => { setPhotoPreview(null); setPhotoUrl(null) }}>
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 px-6 text-center">
                <p className="text-base font-medium text-white">Sube tu foto semanal</p>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">Puedes ampliar la imagen antes de enviarla para revisar encuadre y calidad.</p>
                <span className="mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Seleccionar archivo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Cierre semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Molestias o dolor</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_ZONES.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => togglePainZone(zone)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    form.pain_zones.includes(zone)
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-[0.18em]">Notas</Label>
            <textarea
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Qué funcionó bien, qué te costó más y qué quieres revisar con tu entrenador."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Check-in</h2>
        <p className="mt-1 text-sm text-zinc-400">Un flujo más simple para registrar cómo vienes y darle contexto real a tu entrenador.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setCheckinType('daily'); setStep(0) }}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            checkinType === 'daily'
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
          }`}
        >
          Diario
        </button>
        <button
          type="button"
          onClick={() => { setCheckinType('weekly'); setStep(0) }}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            checkinType === 'weekly'
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
          }`}
        >
          Semanal
        </button>
      </div>

      <div className="mb-6 space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <StepPill key={label} active={index === step} done={index < step} label={label} />
          ))}
        </div>
      </div>

      {checkinType === 'daily' ? renderDailyStep() : renderWeeklyStep()}

      {error && (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={step === 0 ? () => router.back() : goBack} className="flex-1 border-zinc-700 text-zinc-300">
          {step === 0 ? 'Cancelar' : 'Volver'}
        </Button>
        {step === steps.length - 1 ? (
          <Button onClick={handleSubmit} disabled={loading || uploadingPhoto} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
            {loading ? 'Enviando...' : 'Enviar check-in'}
          </Button>
        ) : (
          <Button onClick={goNext} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
            Continuar
          </Button>
        )}
      </div>

      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 p-2">
          <DialogTitle className="sr-only">Vista completa de la foto</DialogTitle>
          {photoPreview && (
            <img src={photoPreview} alt="Vista completa" className="max-h-[80vh] w-full object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClientCheckinPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500">Cargando check-in...</div>}>
      <CheckinForm />
    </Suspense>
  )
}
