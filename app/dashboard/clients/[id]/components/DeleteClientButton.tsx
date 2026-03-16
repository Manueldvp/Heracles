'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

export default function DeleteClientButton({ clientId, clientName }: { clientId: string, clientName: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await supabase.from('clients').delete().eq('id', clientId)
    setOpen(false)
    router.push('/dashboard/clients')
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10 w-8 h-8 p-0"
      >
        <Trash2 size={14} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <DialogTitle className="text-white">¿Eliminar cliente?</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Eliminarás a <span className="text-white font-semibold">{clientName}</span> junto con todas sus rutinas, planes y check-ins. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 text-zinc-400 flex-1">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white flex-1">
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}