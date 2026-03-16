'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function InviteButton({ clientId, email }: { clientId: string, email: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async () => {
    if (!email) {
      setError('El cliente no tiene email registrado')
      return
    }
    setLoading(true)
    const res = await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, email }),
    })

    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json()
      setError(data.error)
    }
    setLoading(false)
  }

  if (sent) return <p className="text-green-400 text-sm">✓ Invitación enviada</p>

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleInvite}
        disabled={loading}
        variant="outline"
        className="border-zinc-700 text-zinc-400 hover:text-white"
      >
        <Mail size={16} className="mr-2" />
        {loading ? 'Enviando...' : 'Invitar cliente'}
      </Button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}