'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UpgradeButton({
  planType,
  label,
}: {
  planType: 'pro' | 'studio'
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo iniciar el checkout')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el checkout')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} className="w-full rounded-xl">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirigiendo...</> : (label ?? 'Actualizar plan')}
      </Button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
