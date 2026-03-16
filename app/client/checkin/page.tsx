'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, X, Droplets, Flame, Brain, Zap, Moon, Dumbbell, Heart } from 'lucide-react'

const PAIN_ZONES = ['Cuello', 'Hombro izq', 'Hombro der', 'Espalda alta', 'Espalda baja', 'Codo izq', 'Codo der', 'Cadera', 'Rodilla izq', 'Rodilla der', 'Tobillo izq', 'Tobillo der']

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Mal' },
  { value: 2, emoji: '😕', label: 'Regular' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Excelente' },
]

function RatingBar({ value, onChange, color = 'orange' }: { value: number; onChange: (v: number) => void; color?: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }
  return (
    <div className="flex gap-2 items-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
            value >= n ? `${colors[color]} text-white shadow-lg scale-105` : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
          }`}>
          {n}
        </button>
      ))}
    </div>
  )
}

function MoodSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3 justify-between">
      {MOOD_OPTIONS.map(m => (
        <button key={m.value} onClick={() => onChange(m.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
            value === m.value
              ? 'bg-orange-500/20 border border-orange-500/50 scale-105'
              : 'bg-zinc-800 border border-transparent hover:bg-zinc-700'
          }`}>
          <span className="text-2xl">{m.emoji}</span>
          <span className={`text-xs ${value === m.value ? 'text-orange-400' : 'text-zinc-500'}`}>{m.label}</span>
        </button>
      ))}
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

  // Leer type de la URL (?type=daily o ?type=weekly)
  const typeParam = searchParams.get('type')
  const [checkinType, setCheckinType] = useState<'daily' | 'weekly'>(
    typeParam === 'weekly' ? 'weekly' : 'daily'
  )

  const [form, setForm] = useState({
    energy_level: 3,
    sleep_quality: 3,
    mood: 3,
    pain_zones: [] as string[],
    water_liters: '',
    calories_consumed: '',
    notes: '',
    weight: '',
    completed_workouts: 0,
    stress_level: 3,
    nutrition_adherence: 3,
  })

  const togglePainZone = (zone: string) => {
    setForm(f => ({
      ...f,
      pain_zones: f.pain_zones.includes(zone)
        ? f.pain_zones.filter(z => z !== zone)
        : [...f.pain_zones, zone]
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setPhotoPreview(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'heracles/checkins')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      setPhotoUrl(data.secure_url)
    } catch {
      setError('Error subiendo la foto, intenta de nuevo')
      setPhotoPreview(null)
    }
    setUploadingPhoto(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: client } = await supabase
      .from('clients')
      .select('id, trainer_id, full_name')
      .eq('user_id', user.id)
      .single()
    if (!client) { setError('No se encontró tu perfil'); setLoading(false); return }

    const { error: insertError } = await supabase.from('checkins').insert({
      client_id: client.id,
      type: checkinType,
      energy_level: form.energy_level,
      sleep_quality: form.sleep_quality,
      mood: form.mood,
      pain_zones: form.pain_zones,
      water_liters: form.water_liters ? parseFloat(form.water_liters) : null,
      calories_consumed: form.calories_consumed ? parseInt(form.calories_consumed) : null,
      completed_workouts: form.completed_workouts,
      weight: form.weight ? parseFloat(form.weight) : null,
      notes: form.notes,
      stress_level: checkinType === 'weekly' ? form.stress_level : null,
      nutrition_adherence: checkinType === 'weekly' ? form.nutrition_adherence : null,
      photo_url: checkinType === 'weekly' ? photoUrl : null,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }

    await fetch('/api/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: client.id,
        clientName: client.full_name,
        trainerId: client.trainer_id,
        checkinType,
      }),
    })

    router.push('/client')
  }

  return (
    <div className="max-w-lg mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Check-in</h2>
        <p className="text-zinc-400 text-sm mt-1">Registra cómo te sientes hoy</p>
      </div>

      <Tabs value={checkinType} onValueChange={v => setCheckinType(v as 'daily' | 'weekly')} className="mb-6">
        <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 w-full">
          <TabsTrigger value="daily" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
            📅 Diario
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
            📊 Semanal
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        {/* Mood */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-purple-400" />
              <Label className="text-white font-semibold">Estado de ánimo</Label>
            </div>
            <MoodSelector value={form.mood} onChange={v => setForm({ ...form, mood: v })} />
          </CardContent>
        </Card>

        {/* Energy & Sleep */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-5 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-orange-400" />
                <Label className="text-white font-semibold">Energía</Label>
                <span className="text-zinc-600 text-xs ml-auto">1 = Sin energía · 5 = Lleno</span>
              </div>
              <RatingBar value={form.energy_level} onChange={v => setForm({ ...form, energy_level: v })} color="orange" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Moon size={16} className="text-blue-400" />
                <Label className="text-white font-semibold">Sueño</Label>
                <span className="text-zinc-600 text-xs ml-auto">1 = Muy malo · 5 = Perfecto</span>
              </div>
              <RatingBar value={form.sleep_quality} onChange={v => setForm({ ...form, sleep_quality: v })} color="blue" />
            </div>
          </CardContent>
        </Card>

        {/* Workouts & Water & Calories */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-5 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={16} className="text-green-400" />
                <Label className="text-white font-semibold">Entrenamientos completados</Label>
              </div>
              <div className="flex gap-2">
                {[0,1,2,3,4,5,6,7].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, completed_workouts: n })}
                    className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                      form.completed_workouts === n
                        ? 'bg-green-500 text-white shadow-lg scale-105'
                        : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={14} className="text-blue-400" />
                  <Label className="text-zinc-400 text-xs">Agua (litros)</Label>
                </div>
                <Input type="number" step="0.5" placeholder="2.5" value={form.water_liters}
                  onChange={e => setForm({ ...form, water_liters: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={14} className="text-orange-400" />
                  <Label className="text-zinc-400 text-xs">Calorías consumidas</Label>
                </div>
                <Input type="number" placeholder="2000" value={form.calories_consumed}
                  onChange={e => setForm({ ...form, calories_consumed: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pain zones */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-red-400" />
              <Label className="text-white font-semibold">Dolor o molestias</Label>
              <span className="text-zinc-600 text-xs ml-auto">Opcional</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PAIN_ZONES.map(zone => (
                <button key={zone} onClick={() => togglePainZone(zone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.pain_zones.includes(zone)
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}>
                  {zone}
                </button>
              ))}
            </div>
            {form.pain_zones.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {form.pain_zones.map(z => (
                  <Badge key={z} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    {z}
                    <button onClick={() => togglePainZone(z)} className="ml-1"><X size={10} /></button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly extras */}
        {checkinType === 'weekly' && (
          <>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-5 pb-5 flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🧠</span>
                    <Label className="text-white font-semibold">Nivel de estrés</Label>
                    <span className="text-zinc-600 text-xs ml-auto">1 = Sin estrés · 5 = Muy estresado</span>
                  </div>
                  <RatingBar value={form.stress_level} onChange={v => setForm({ ...form, stress_level: v })} color="red" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🥗</span>
                    <Label className="text-white font-semibold">Adherencia al plan nutricional</Label>
                    <span className="text-zinc-600 text-xs ml-auto">1 = Nada · 5 = Al 100%</span>
                  </div>
                  <RatingBar value={form.nutrition_adherence} onChange={v => setForm({ ...form, nutrition_adherence: v })} color="green" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs mb-2 block">Peso actual (kg)</Label>
                  <Input type="number" step="0.1" placeholder="75.5" value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white max-w-[140px]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Upload size={16} className="text-orange-400" />
                  <Label className="text-white font-semibold">Foto de progreso</Label>
                  <span className="text-zinc-600 text-xs ml-auto">Opcional</span>
                </div>
                {photoPreview ? (
                  <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoUrl(null) }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                      <X size={14} />
                    </button>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    {!uploadingPhoto && photoUrl && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors">
                    <Upload size={24} className="text-zinc-600 mb-2" />
                    <p className="text-zinc-500 text-sm">Toca para subir foto</p>
                    <p className="text-zinc-700 text-xs mt-1">JPG, PNG · máx 10MB</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Notes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-5">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-3 block">
              Notas para tu entrenador
            </Label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="¿Algo que quieras contarle a tu entrenador? Lesiones, dudas, logros..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 resize-none text-sm placeholder:text-zinc-600" />
          </CardContent>
        </Card>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400 flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploadingPhoto}
            className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : '✓ Enviar check-in'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ClientCheckinPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <CheckinForm />
    </Suspense>
  )
}
