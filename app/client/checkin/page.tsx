'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Frown,
  HeartPulse,
  Laugh,
  Meh,
  Moon,
  MoonStar,
  Smile,
  Sparkles,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import PageLoader from '@/components/ui/page-loader'
import SubscriptionStatusCard from '@/components/subscriptions/subscription-status-card'
import {
  ClientSubscriptionSummary,
  summarizeClientSubscription,
} from '@/lib/client-subscriptions'

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

type ExistingCheckin = {
  id: string
  type: CheckinType
  mood: number | null
  energy_level: number | null
  sleep_quality: number | null
  completed_workouts: number | null
  nutrition_adherence: number | null
  water_liters: number | null
  calories_consumed: number | null
  notes: string | null
  pain_zones: string[] | null
  stress_level: number | null
  weight: number | null
  photo_url: string | null
  created_at: string
}

function getPeriodRange(type: CheckinType) {
  const now = new Date()
  const start = new Date(now)

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0)
  } else {
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
  }

  const end = new Date(start)
  if (type === 'daily') {
    end.setDate(end.getDate() + 1)
  } else {
    end.setDate(end.getDate() + 7)
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function buildFormFromCheckin(checkin: ExistingCheckin): FormState {
  return {
    mood: checkin.mood ?? 3,
    energy_level: checkin.energy_level ?? 3,
    sleep_quality: checkin.sleep_quality ?? 3,
    completed_workouts: checkin.completed_workouts ?? 0,
    adherence: checkin.type === 'daily' ? (checkin.nutrition_adherence ?? 3) : 3,
    water_liters: checkin.water_liters?.toString() ?? '',
    calories_consumed: checkin.calories_consumed?.toString() ?? '',
    notes: checkin.notes ?? '',
    pain_zones: checkin.pain_zones ?? [],
    stress_level: checkin.stress_level ?? 3,
    nutrition_adherence: checkin.type === 'weekly' ? (checkin.nutrition_adherence ?? 3) : 3,
    weight: checkin.weight?.toString() ?? '',
  }
}

function getFriendlyCheckinError(message: string | null | undefined, type: CheckinType) {
  if (!message) return 'No se pudo guardar tu check-in. Intenta de nuevo.'

  if (message.includes('duplicate key value') || message.includes('checkins_daily_once_per_local_day_idx')) {
    return 'Ya enviaste tu check-in de hoy. Puedes editarlo, pero no crear otro.'
  }

  if (message.includes('checkins_weekly_once_per_local_week_idx')) {
    return 'Ya enviaste tu check-in semanal de esta semana. Puedes editarlo, pero no crear otro.'
  }

  return type === 'daily'
    ? 'No se pudo guardar tu check-in diario. Intenta de nuevo.'
    : 'No se pudo guardar tu check-in semanal. Intenta de nuevo.'
}

function ScaleSelector({
  label,
  helper,
  value,
  kind = 'default',
  onChange,
}: {
  label: string
  helper?: string
  value: number
  kind?: 'default' | 'mood' | 'energy' | 'sleep'
  onChange: (value: number) => void
}) {
  const items = {
    mood: [
      { icon: Frown, label: 'Muy mal' },
      { icon: Meh, label: 'Bajo' },
      { icon: Smile, label: 'Neutral' },
      { icon: Smile, label: 'Bien' },
      { icon: Laugh, label: 'Muy bien' },
    ],
    energy: [
      { icon: BatteryWarning, label: 'Vacío' },
      { icon: BatteryLow, label: 'Bajo' },
      { icon: BatteryMedium, label: 'Medio' },
      { icon: Zap, label: 'Activo' },
      { icon: Zap, label: 'A tope' },
    ],
    sleep: [
      { icon: Moon, label: 'Muy mal' },
      { icon: Moon, label: 'Bajo' },
      { icon: MoonStar, label: 'Aceptable' },
      { icon: MoonStar, label: 'Bien' },
      { icon: MoonStar, label: 'Muy bien' },
    ],
    default: SCALE.map((option) => ({ icon: null, label: `${option}` })),
  }[kind]

  const current = items[value - 1]

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
        </div>
        <span className="text-sm font-semibold text-foreground">{current?.label ?? `${value}/5`}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item, index) => {
          const option = index + 1
          const Icon = item.icon
          return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl border px-3 py-3 text-sm transition ${
              value === option
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'
            }`}
            aria-label={`${label}: ${item.label}`}
          >
            <div className="flex flex-col items-center gap-1">
              {Icon ? <Icon className="h-4 w-4" /> : <span>{option}</span>}
              <span className="text-[10px] leading-none">{item.label}</span>
            </div>
          </button>
        )})}
      </div>
    </div>
  )
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs transition ${
      active ? 'border-primary/20 bg-primary/10 text-primary' :
      done ? 'border-border bg-muted/40 text-foreground' :
      'border-border bg-background text-muted-foreground'
    }`}>
      {label}
    </div>
  )
}

function CheckinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [step, setStep] = useState(0)
  const [subscriptionSummary, setSubscriptionSummary] = useState<ClientSubscriptionSummary | null>(null)
  const [existingCheckin, setExistingCheckin] = useState<ExistingCheckin | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

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

  useEffect(() => {
    let mounted = true

    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setSubscriptionSummary(summarizeClientSubscription(null))
        setInitialLoading(false)
        return
      }

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!mounted) return

      if (!client) {
        setSubscriptionSummary(summarizeClientSubscription(null))
        setInitialLoading(false)
        return
      }

      setClientId(client.id)

      const { data: subscription } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle()

      if (!mounted) return

      setSubscriptionSummary(summarizeClientSubscription(subscription))

      const range = getPeriodRange(checkinType)
      const { data: existing } = await supabase
        .from('checkins')
        .select('id, type, mood, energy_level, sleep_quality, completed_workouts, nutrition_adherence, water_liters, calories_consumed, notes, pain_zones, stress_level, weight, photo_url, created_at')
        .eq('client_id', client.id)
        .eq('type', checkinType)
        .gte('created_at', range.startIso)
        .lt('created_at', range.endIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!mounted) return

      setExistingCheckin((existing as ExistingCheckin | null) ?? null)

      if (existing) {
        setForm(buildFormFromCheckin(existing as ExistingCheckin))
        setPhotoUrl((existing as ExistingCheckin).photo_url)
        setPhotoPreview((existing as ExistingCheckin).photo_url)
      } else {
        setPhotoUrl(null)
        setPhotoPreview(null)
        setForm({
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
      }

      setInitialLoading(false)
    }

    void loadInitialData()

    return () => {
      mounted = false
    }
  }, [checkinType, supabase])

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

  const persistCheckin = async () => {
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

    const parsedWeight = checkinType === 'weekly' && form.weight ? parseFloat(form.weight) : null

    const payload = {
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
      weight: parsedWeight,
      photo_url: checkinType === 'weekly' ? photoUrl : null,
    }

    const result = existingCheckin
      ? await supabase.from('checkins').update(payload).eq('id', existingCheckin.id)
      : await supabase.from('checkins').insert(payload)

    if (result.error) {
      setError(getFriendlyCheckinError(result.error.message, checkinType))
      setLoading(false)
      return
    }

    if (parsedWeight !== null) {
      const { error: updateWeightError } = await supabase
        .from('clients')
        .update({ weight: parsedWeight })
        .eq('id', client.id)

      if (updateWeightError) {
        console.error('Client weight sync error:', updateWeightError)
      }
    }

    if (!existingCheckin) {
      await fetch('/api/notify-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, checkinType }),
      })
    }

    router.push('/client')
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setError('Completa la información requerida antes de enviar.')
      return
    }

    setShowConfirmModal(true)
  }

  const renderDailyStep = () => {
    if (step === 0) {
      return (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Cómo te sentiste hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector kind="mood" label="Estado de ánimo" value={form.mood} onChange={value => setForm(current => ({ ...current, mood: value }))} />
            <ScaleSelector kind="energy" label="Nivel de energía" value={form.energy_level} onChange={value => setForm(current => ({ ...current, energy_level: value }))} />
            <ScaleSelector kind="sleep" label="Calidad del sueño" value={form.sleep_quality} onChange={value => setForm(current => ({ ...current, sleep_quality: value }))} />
          </CardContent>
        </Card>
      )
    }

    if (step === 1) {
      return (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Cumplimiento del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Adherencia al plan" helper="Qué tan bien cumpliste con lo planificado hoy" value={form.adherence} onChange={value => setForm(current => ({ ...current, adherence: value }))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrenos</Label>
                <Input type="number" min={0} max={7} value={form.completed_workouts} onChange={event => setForm(current => ({ ...current, completed_workouts: Math.max(0, parseInt(event.target.value || '0', 10)) }))} className="border-border bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Agua</Label>
                <Input type="number" step="0.5" value={form.water_liters} onChange={event => setForm(current => ({ ...current, water_liters: event.target.value }))} placeholder="2.5" className="border-border bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Calorías</Label>
                <Input type="number" value={form.calories_consumed} onChange={event => setForm(current => ({ ...current, calories_consumed: event.target.value }))} placeholder="2100" className="border-border bg-background text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Notas opcionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Molestias o dolor</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_ZONES.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => togglePainZone(zone)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    form.pain_zones.includes(zone)
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notas</Label>
            <textarea
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Cuéntale a tu entrenador cómo estuvo el día o si necesitas ajustar algo."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/20"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWeeklyStep = () => {
    if (step === 0) {
      return (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Resumen de la semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector kind="mood" label="Estado de ánimo" value={form.mood} onChange={value => setForm(current => ({ ...current, mood: value }))} />
            <ScaleSelector kind="energy" label="Energía general" value={form.energy_level} onChange={value => setForm(current => ({ ...current, energy_level: value }))} />
            <ScaleSelector kind="sleep" label="Sueño promedio" value={form.sleep_quality} onChange={value => setForm(current => ({ ...current, sleep_quality: value }))} />
          </CardContent>
        </Card>
      )
    }

    if (step === 1) {
      return (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Cumplimiento semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScaleSelector label="Adherencia nutricional" value={form.nutrition_adherence} onChange={value => setForm(current => ({ ...current, nutrition_adherence: value }))} />
            <ScaleSelector label="Nivel de estrés" value={form.stress_level} onChange={value => setForm(current => ({ ...current, stress_level: value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Peso actual</Label>
                <Input type="number" step="0.1" value={form.weight} onChange={event => setForm(current => ({ ...current, weight: event.target.value }))} placeholder="75.5" className="border-border bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrenos</Label>
                <Input type="number" min={0} max={14} value={form.completed_workouts} onChange={event => setForm(current => ({ ...current, completed_workouts: Math.max(0, parseInt(event.target.value || '0', 10)) }))} className="border-border bg-background text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (step === 2) {
      return (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Foto de progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoPreview ? (
              <div className="space-y-3">
                <button type="button" onClick={() => setShowPhotoModal(true)} className="block w-full overflow-hidden rounded-xl border border-border">
                  <img src={photoPreview} alt="Vista previa" className="h-[320px] w-full object-cover" />
                </button>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{uploadingPhoto ? 'Subiendo imagen...' : 'Imagen lista para enviar'}</p>
                  <Button type="button" variant="outline" className="border-border text-foreground" onClick={() => { setPhotoPreview(null); setPhotoUrl(null) }}>
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
                <Camera className="h-7 w-7 text-primary" />
                <p className="mt-4 text-base font-medium text-foreground">Sube tu foto semanal</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Puedes ampliar la imagen antes de enviarla para revisar encuadre y calidad.</p>
                <span className="mt-4 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">Seleccionar archivo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Cierre semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Molestias o dolor</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_ZONES.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => togglePainZone(zone)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    form.pain_zones.includes(zone)
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notas</Label>
            <textarea
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Qué funcionó bien, qué te costó más y qué quieres revisar con tu entrenador."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/20"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (initialLoading) {
    return <PageLoader />
  }

  if (subscriptionSummary && !subscriptionSummary.isActive) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <SubscriptionStatusCard
          summary={subscriptionSummary}
          title="No puedes enviar check-ins ahora"
          body="Tu acceso esta pausado o vencido. Cuando tu entrenador reactive la suscripcion, podras volver a registrar tus avances."
          ctaHref="/client"
          ctaLabel="Volver al dashboard"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Check-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Un flujo más simple para registrar cómo vienes y darle contexto real a tu entrenador.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <HeartPulse className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Estado general</p>
            <p className="mt-1 text-xs text-muted-foreground">Energía, sueño y adherencia.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <Camera className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Seguimiento visual</p>
            <p className="mt-1 text-xs text-muted-foreground">Foto semanal cuando aplique.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Contexto útil</p>
            <p className="mt-1 text-xs text-muted-foreground">Notas y molestias para mejores ajustes.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setCheckinType('daily'); setStep(0) }}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            checkinType === 'daily'
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'
          }`}
        >
          Diario
        </button>
        <button
          type="button"
          onClick={() => { setCheckinType('weekly'); setStep(0) }}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            checkinType === 'weekly'
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'
          }`}
        >
          Semanal
        </button>
      </div>

      {clientId && existingCheckin && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
            <div>
              <p className="text-sm font-medium text-amber-200">
                Ya tienes un check-in {checkinType === 'daily' ? 'de hoy' : 'de esta semana'}.
              </p>
              <p className="mt-1 text-xs text-amber-100/80">
                Lo que hagas aquí actualizará ese mismo registro. No se creará un check-in nuevo.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
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
        <Button variant="outline" onClick={step === 0 ? () => router.back() : goBack} className="flex-1 border-border text-foreground">
          {step === 0 ? 'Cancelar' : 'Volver'}
        </Button>
        {step === steps.length - 1 ? (
          <Button onClick={handleSubmit} disabled={loading || uploadingPhoto} className="flex-1 rounded-xl">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : existingCheckin ? 'Guardar cambios' : 'Enviar check-in'}
          </Button>
        ) : (
          <Button onClick={goNext} className="flex-1 rounded-xl">
            Continuar
          </Button>
        )}
      </div>

      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-3xl border-border bg-card p-2">
          <DialogTitle className="sr-only">Vista completa de la foto</DialogTitle>
          {photoPreview && (
            <img src={photoPreview} alt="Vista completa" className="max-h-[80vh] w-full object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogTitle className="text-base text-foreground">
            {existingCheckin ? '¿Seguro que quieres actualizar este check-in?' : '¿Seguro que quieres enviar este check-in?'}
          </DialogTitle>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {existingCheckin
                ? 'Tu entrenador verá la versión actualizada del check-in de este período.'
                : 'Una vez enviado, tu entrenador usará esta información para ajustar tu seguimiento.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Revisa especialmente peso, entrenos completados, adherencia y notas antes de confirmar.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border-border text-foreground"
              >
                Revisar otra vez
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  void persistCheckin()
                }}
                disabled={loading || uploadingPhoto}
                className="flex-1"
              >
                {loading ? 'Guardando...' : existingCheckin ? 'Sí, actualizar' : 'Sí, enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClientCheckinPage() {
  return (
    <Suspense fallback={<PageLoader compact />}>
      <CheckinForm />
    </Suspense>
  )
}
