'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateOnboardingProgress } from '@/lib/onboarding'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutTemplate, Dumbbell, ChevronRight, Loader2,
  Plus, ArrowLeft, Check, Trash2
} from 'lucide-react'

interface Template {
  id: string
  title: string
  description?: string
  content: any
  created_at: string
}

export default function RoutineTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const supabase = createClient()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('routine_templates')
      .select('*')
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
    setLoading(false)
  }

  const applyTemplate = async (template: Template) => {
    setApplying(template.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Deactivate existing routines
      await supabase.from('routines')
        .update({ is_active: false })
        .eq('client_id', clientId)

      // Create new routine from template
      const { data: routine } = await supabase.from('routines').insert({
        client_id: clientId,
        trainer_id: user!.id,
        title: template.title,
        content: template.content,
        is_active: true,
        type: 'manual',
      }).select().single()

      if (routine) {
        await updateOnboardingProgress(supabase, user!.id, {
          created_routine: true,
          assigned_routine: true,
        })
        router.push(`/dashboard/clients/${clientId}/routines/${routine.id}`)
      }
    } catch (e) {
      console.error(e)
    }
    setApplying(null)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    setDeleting(id)
    await supabase.from('routine_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  const getDayCount = (content: any) => content?.days?.length ?? 0
  const getExerciseCount = (content: any) =>
    content?.days?.reduce((acc: number, d: any) => acc + (d.exercises?.length ?? 0), 0) ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-zinc-300 transition p-1"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Plantillas de rutinas</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Selecciona una para asignarla al cliente</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card className="bg-zinc-900 border-dashed border-zinc-800">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <LayoutTemplate size={24} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium">Sin plantillas aún</p>
              <p className="text-zinc-600 text-sm mt-1 max-w-[260px]">
                Puedes guardar cualquier rutina como plantilla para reutilizarla con otros clientes
              </p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 max-w-sm">
              <p className="text-blue-400 text-xs text-center">
                Abre cualquier rutina existente → menú → "Guardar como plantilla"
              </p>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white mt-2"
            >
              Volver y crear una rutina
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map(template => {
            const days = getDayCount(template.content)
            const exercises = getExerciseCount(template.content)
            const isApplying = applying === template.id
            const isDeleting = deleting === template.id

            return (
              <Card key={template.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <LayoutTemplate size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{template.title}</p>
                      {template.description && (
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                          {days} {days === 1 ? 'día' : 'días'}
                        </Badge>
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                          {exercises} ejercicios
                        </Badge>
                        <span className="text-zinc-600 text-xs">
                          {new Date(template.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Days preview */}
                      {template.content?.days && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {template.content.days.map((d: any, i: number) => (
                            <span key={i} className="text-xs bg-zinc-800 text-zinc-500 rounded-lg px-2 py-0.5 border border-zinc-700/50">
                              {d.day}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        disabled={!!isDeleting}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/15 flex items-center justify-center text-zinc-600 hover:text-red-400 transition"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                      <Button
                        onClick={() => applyTemplate(template)}
                        disabled={!!applying}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs gap-1.5 px-3"
                      >
                        {isApplying
                          ? <><Loader2 size={12} className="animate-spin" /> Aplicando...</>
                          : <><Check size={12} /> Usar esta</>
                        }
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
