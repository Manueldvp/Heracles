'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera } from 'lucide-react'

type PhotoItem = {
  id: string
  url: string
  createdAt: string
}

export default function CheckinPhotoGallery({ items }: { items: PhotoItem[] }) {
  const [selected, setSelected] = useState<PhotoItem | null>(null)

  if (items.length === 0) return null

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <Camera size={14} className="text-primary" />
            Galería de check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-left transition hover:border-primary/30"
              >
                <img src={item.url} alt="Foto de progreso" className="h-44 w-full object-cover" />
                <div className="px-3 py-2">
                  <p className="text-xs text-zinc-400">
                    {new Date(item.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-950 p-2">
          <DialogTitle className="sr-only">Foto de check-in</DialogTitle>
          {selected ? (
            <img src={selected.url} alt="Foto de progreso ampliada" className="max-h-[85vh] w-full rounded-xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
