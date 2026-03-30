'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WebpayUpgradeButton({
  planType,
  label,
}: {
  planType: 'pro' | 'studio'
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo iniciar el pago con Webpay')
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.url

      const tokenInput = document.createElement('input')
      tokenInput.type = 'hidden'
      tokenInput.name = 'token_ws'
      tokenInput.value = data.token
      form.appendChild(tokenInput)

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago con Webpay')
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleCheckout} disabled={loading} className="w-full rounded-xl">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirigiendo a Webpay...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {label ?? 'Pagar con Webpay'}
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        El pago se valida en Transbank antes de activar tu plan.
      </p>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
