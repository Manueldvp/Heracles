'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateClientProfile } from '@/lib/supabase/rpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageLoader from '@/components/ui/page-loader'
import { Camera, User, Target } from 'lucide-react'

const goalOptions = [
  { value: 'muscle_gain', label: 'Ganancia muscular' },
  { value: 'fat_loss', label: 'Pérdida de grasa' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'endurance', label: 'Resistencia' },
]

const levelOptions = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

export default function ClientProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    level: '',
    restrictions: '',
    avatar_url: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (client) {
        setForm({
          full_name: client.full_name || '',
          age: client.age?.toString() || '',
          weight: client.weight?.toString() || '',
          height: client.height?.toString() || '',
          goal: client.goal || '',
          level: client.level || '',
          restrictions: client.restrictions || '',
          avatar_url: client.avatar_url || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'heracles/avatars')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      setForm(f => ({ ...f, avatar_url: data.secure_url }))
    } catch {
      alert('Error subiendo imagen')
    }
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateClientProfile(supabase, {
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      goal: form.goal,
      level: form.level,
      restrictions: form.restrictions,
      avatar_url: form.avatar_url,
    })
    if (error) {
      alert(error.message ?? 'No fue posible actualizar tu perfil')
      setSaving(false)
      return
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <PageLoader compact />

  return (
    <div className="max-w-lg mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Mi perfil</h2>
        <p className="text-zinc-500 text-sm mt-1">Mantén tu información actualizada</p>
      </div>

      {/* Avatar */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center overflow-hidden">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-orange-400 font-bold text-3xl">
                    {form.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition shadow-lg"
              >
                {uploadingAvatar
                  ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera size={13} className="text-white" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-white font-semibold">{form.full_name || 'Tu nombre'}</p>
              <p className="text-zinc-500 text-sm mt-0.5">{goalOptions.find(g => g.value === form.goal)?.label ?? 'Sin objetivo'}</p>
              <p className="text-zinc-600 text-xs mt-1">Toca el ícono para cambiar tu foto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info personal */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <User size={15} className="text-orange-400" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Nombre completo</Label>
            <Input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Edad</Label>
              <Input
                type="number"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                placeholder="25"
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                placeholder="75"
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Altura (cm)</Label>
              <Input
                type="number"
                value={form.height}
                onChange={e => setForm({ ...form, height: e.target.value })}
                placeholder="175"
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objetivo y nivel */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Target size={15} className="text-blue-400" />
            Objetivo y nivel
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-3 block">Objetivo</Label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, goal: opt.value })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                    form.goal === opt.value
                      ? 'border border-orange-500 bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-3 block">Nivel</Label>
            <div className="grid grid-cols-3 gap-2">
              {levelOptions.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, level: opt.value })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    form.level === opt.value
                      ? 'border border-blue-400 bg-blue-500 text-white shadow-[0_10px_24px_rgba(59,130,246,0.22)]'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">
              Restricciones o lesiones
            </Label>
            <textarea
              value={form.restrictions}
              onChange={e => setForm({ ...form, restrictions: e.target.value })}
              placeholder="Ej: Dolor de rodilla derecha, alergia al gluten..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500 resize-none placeholder:text-zinc-600"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <p className="text-green-400 text-sm flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</span>
            Guardado
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
