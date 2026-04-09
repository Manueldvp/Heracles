'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import PriorityAttentionCard from './PriorityAttentionCard'

type AttentionCard = {
  id: string
  clientId: string
  name: string
  detail: string
  action: string
  tone: 'rose' | 'slate'
  href?: string
  remindMessage?: string
}

export default function DashboardAttentionCards({ initialCards }: { initialCards: AttentionCard[] }) {
  const [cards, setCards] = useState(initialCards)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 4

  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const visibleCards = cards.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const handleReminder = async (card: AttentionCard) => {
    setPendingId(card.id)

    const response = await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: card.clientId,
        type: 'reminder',
        message: card.remindMessage ?? 'Tu entrenador te recordó retomar tu seguimiento y registrar tu progreso.',
      }),
    })

    if (response.ok) {
      setCards((current) => {
        const next = current.filter(item => item.id !== card.id)
        const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
        setPage((currentPage) => Math.min(currentPage, nextTotalPages - 1))
        return next
      })
    }

    setPendingId(null)
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">No hay acciones rápidas para realizar.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleCards.map(card => (
              <PriorityAttentionCard
                key={card.id}
                name={card.name}
                detail={card.detail}
                actionLabel={pendingId === card.id ? 'Enviando...' : card.action}
                tone={card.tone}
                onAction={card.action === 'Recordar' ? () => void handleReminder(card) : undefined}
                href={card.action === 'Recordar' ? undefined : card.href}
                disabled={pendingId === card.id}
              />
            ))}
          </div>

          {cards.length > pageSize ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {safePage * pageSize + 1}-{Math.min(cards.length, safePage * pageSize + pageSize)} de {cards.length}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={safePage === 0}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={safePage >= totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
