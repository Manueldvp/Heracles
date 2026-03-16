'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { LayoutTemplate, Check, Loader2 } from 'lucide-react'

interface Props {
  routineTitle: string
  routineContent: any
}

export default function SaveAsTemplateButton({ routineTitle, routineContent }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(routineTitle)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('routine_templates').insert({
      trainer_id: user!.id,
      title: title.trim(),
      description: description.trim() || null,
      content: routineContent,
    })

    setSaved(true)
    setSaving(false)
    setTimeout(() => {
      setOpen(false)
      setSaved(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-500/40 gap-1.5"
        >
          <LayoutTemplate size={14} />
          Guardar como plantilla
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Guardar como plantilla</DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={22} className="text-green-400" />
            </div>
            <p className="text-white font-medium">¡Plantilla guardada!</p>
            <p className="text-zinc-500 text-sm text-center">
              Ya puedes reutilizarla con otros clientes
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium">Nombre de la plantilla</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Rutina de hipertrofia 4 días"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium">Descripción (opcional)</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Para clientes intermedios con objetivo de masa"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2.5">
              <p className="text-zinc-500 text-xs">
                Esta rutina se guardará como plantilla y podrás asignarla a otros clientes sin modificar la original.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white h-11 gap-2"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                : <><LayoutTemplate size={15} /> Guardar plantilla</>
              }
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
