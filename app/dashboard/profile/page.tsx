'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileText, Trash2, Plus, Camera, Zap, User, Brain, GraduationCap } from 'lucide-react'

const DEFAULT_PROMPT = `Eres un asistente experto de entrenamiento personal.
Tu personalidad:
- Eres motivador pero directo
- Das consejos basados en ciencia y experiencia práctica
- Nunca mencionas que eres una IA de Google
- Hablas en español con un tono cercano y profesional
- Siempre priorizas la seguridad del cliente
- Ante cualquier dolor inusual recomiendas consultar un médico`

interface Document {
  name: string
  url: string
  type: string
  uploaded_at: string
}

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [newCert, setNewCert] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    specialty: '',
    certifications: [] as string[],
    ai_trainer_name: 'Treinex',
    ai_system_prompt: DEFAULT_PROMPT,
    avatar_url: '',
    documents: [] as Document[],
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          specialty: profile.specialty || '',
          certifications: profile.certifications || [],
          ai_trainer_name: profile.ai_trainer_name || 'Treinex',
          ai_system_prompt: profile.ai_system_prompt || DEFAULT_PROMPT,
          avatar_url: profile.avatar_url || '',
          documents: profile.documents || [],
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

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'heracles/documents')
      const isPdf = file.type === 'application/pdf'
      const endpoint = isPdf ? 'raw' : 'image'
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      const newDoc: Document = {
        name: file.name,
        url: data.secure_url,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      }
      setForm(f => ({ ...f, documents: [...f.documents, newDoc] }))
    } catch {
      alert('Error subiendo documento')
    }
    setUploadingDoc(false)
  }

  const removeDoc = (idx: number) => {
    setForm(f => ({ ...f, documents: f.documents.filter((_, i) => i !== idx) }))
  }

  const addCert = () => {
    if (!newCert.trim()) return
    setForm(f => ({ ...f, certifications: [...f.certifications, newCert.trim()] }))
    setNewCert('')
  }

  const removeCert = (idx: number) => {
    setForm(f => ({ ...f, certifications: f.certifications.filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: form.full_name,
      bio: form.bio,
      specialty: form.specialty,
      certifications: form.certifications,
      ai_trainer_name: form.ai_trainer_name,
      ai_system_prompt: form.ai_system_prompt,
      avatar_url: form.avatar_url,
      documents: form.documents,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Mi perfil</h2>
        <p className="text-zinc-500 text-sm mt-1">Configura tu información y personaliza la IA</p>
      </div>

      {/* Avatar + Info básica */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <User size={15} className="text-orange-400" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">

          {/* Avatar */}
          <div className="flex items-center gap-5">
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
            <div className="flex-1">
              <p className="text-white font-semibold">{form.full_name || 'Tu nombre'}</p>
              <p className="text-zinc-500 text-sm mt-0.5">{form.specialty || 'Entrenador personal'}</p>
              <p className="text-zinc-600 text-xs mt-1">Toca el ícono de cámara para cambiar tu foto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Nombre completo</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Tu nombre"
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Especialidad</Label>
              <Input
                value={form.specialty}
                onChange={e => setForm({ ...form, specialty: e.target.value })}
                placeholder="Ej: Hipertrofia, Pérdida de grasa..."
                className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Bio</Label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Cuéntales a tus clientes quién eres y tu experiencia..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500 resize-none placeholder:text-zinc-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Certificaciones */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <GraduationCap size={15} className="text-green-400" />
            Certificaciones y estudios
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              value={newCert}
              onChange={e => setNewCert(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCert()}
              placeholder="Ej: NSCA-CPT, Licenciado en CAFD..."
              className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500 flex-1"
            />
            <Button onClick={addCert} className="bg-zinc-700 hover:bg-zinc-600 text-white shrink-0">
              <Plus size={16} />
            </Button>
          </div>
          {form.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {form.certifications.map((cert, i) => (
                <Badge key={i} className="bg-green-500/10 text-green-400 border-green-500/30 flex items-center gap-1.5 px-3 py-1">
                  {cert}
                  <button onClick={() => removeCert(i)} className="hover:text-white transition">
                    <X size={11} />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Agrega tus certificaciones para que la IA las incluya en su contexto</p>
          )}

          {/* Documentos */}
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-3 block">
              Documentos y metodología
            </Label>
            <p className="text-zinc-500 text-xs mb-3">
              Sube PDFs, programas de entrenamiento o cualquier documento que quieras que la IA use como referencia para tus clientes.
            </p>

            {form.documents.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {form.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-zinc-600 text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      className="text-blue-400 text-xs hover:text-blue-300 transition shrink-0">
                      Ver
                    </a>
                    <button onClick={() => removeDoc(i)} className="text-zinc-600 hover:text-red-400 transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 w-full h-12 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors">
              {uploadingDoc ? (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={15} className="text-zinc-600" />
                  <span className="text-zinc-500 text-sm">Subir PDF, Word o imagen</span>
                </>
              )}
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" onChange={handleDocUpload} disabled={uploadingDoc} />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Configuración IA */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Zap size={15} className="text-orange-400" />
            Configuración del asistente IA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label className="text-zinc-400 text-xs uppercase tracking-widest mb-2 block">Nombre del asistente</Label>
            <Input
              value={form.ai_trainer_name}
              onChange={e => setForm({ ...form, ai_trainer_name: e.target.value })}
              placeholder="Ej: Treinex, Atlas, FitBot..."
              className="bg-zinc-800 border-zinc-700 text-white focus-visible:border-orange-500"
            />
            <p className="text-zinc-600 text-xs mt-1.5">Nombre con el que el asistente se identifica con tus clientes</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-purple-400" />
              <Label className="text-zinc-400 text-xs uppercase tracking-widest">Metodología y personalidad</Label>
            </div>
            <p className="text-zinc-500 text-xs mb-3">
              Define cómo debe comportarse la IA. Incluye tu filosofía, métodos que priorizas, restricciones y estilo de comunicación. Cuanto más específico, mejor será la IA con tus clientes.
            </p>
            <textarea
              value={form.ai_system_prompt}
              onChange={e => setForm({ ...form, ai_system_prompt: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500 resize-none font-mono placeholder:text-zinc-600"
            />
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <p className="text-zinc-400 text-xs font-semibold mb-2 flex items-center gap-2">
              <FileText size={12} className="text-orange-400" />
              Ejemplo de metodología
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              &quot;Soy Manuel, entrenador con 5 años de experiencia. Priorizo movimientos compuestos sobre aislados. Para ganancia muscular uso periodización ondulante con 3-4 días de entrenamiento. Nunca recomiendo más de 20 series por grupo muscular por semana. Para nutrición prefiero un enfoque flexible sin eliminar grupos alimenticios...&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <p className="text-green-400 text-sm flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</span>
            Guardado correctamente
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
