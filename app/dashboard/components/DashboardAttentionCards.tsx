'use client'

import { useState } from 'react'
import PriorityAttentionCard from './PriorityAttentionCard'

type AttentionCard = {
  id: string
  clientId: string
  name: string
  detail: string
  action: string
  tone: 'rose' | 'slate'
  href?: string
}

export default function DashboardAttentionCards({ initialCards }: { initialCards: AttentionCard[] }) {
  const [cards, setCards] = useState(initialCards)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const handleReminder = async (card: AttentionCard) => {
    setPendingId(card.id)

    const response = await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: card.clientId,
        type: 'reminder',
        message: 'Tu entrenador te recordó retomar tu seguimiento y registrar tu progreso.',
      }),
    })

    if (response.ok) {
      setCards(current => current.filter(item => item.id !== card.id))
    }

    setPendingId(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map(card => (
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
  )
}
