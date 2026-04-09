'use client'

import { useMemo, useState } from 'react'
import { BellRing, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export type QuickActionItem = {
  id: string
  clientId: string
  clientName: string
  title: string
  detail: string
  message: string
}

const PAGE_SIZE = 4

export default function QuickActions({ initialItems }: { initialItems: QuickActionItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const maxPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1)
  const visibleItems = useMemo(() => {
    const safePage = Math.min(page, maxPage)
    const start = safePage * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }, [items, maxPage, page])

  const handleRemind = async (item: QuickActionItem) => {
    setPendingId(item.id)

    const response = await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: item.clientId,
        type: 'reminder',
        message: item.message,
      }),
    })

    if (response.ok) {
      setItems((current) => {
        const next = current.filter((entry) => entry.id !== item.id)
        const nextMaxPage = Math.max(0, Math.ceil(next.length / PAGE_SIZE) - 1)
        setPage((currentPage) => Math.min(currentPage, nextMaxPage))
        return next
      })
    }

    setPendingId(null)
  }

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Acciones rápidas</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30">
          <BellRing className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No hay acciones rápidas para realizar.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {visibleItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-muted/15 px-4 py-3">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.clientName}</p>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                        <p className="min-w-0 truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.title}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="xs"
                        onClick={() => void handleRemind(item)}
                        disabled={pendingId === item.id}
                        className="rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary-hover"
                      >
                        {pendingId === item.id ? <Loader2 size={13} className="animate-spin" /> : 'Recordar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > PAGE_SIZE ? (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {Math.min(page + 1, maxPage + 1)} de {maxPage + 1}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    className="rounded-full"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    className="rounded-full"
                    disabled={page >= maxPage}
                    onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
