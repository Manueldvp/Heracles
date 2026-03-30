import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const REASONS: Record<string, string> = {
  cancelled: 'El pago fue cancelado o no terminó correctamente en Webpay.',
  rejected: 'Webpay confirmó que la transacción no fue aprobada.',
  'missing-token': 'No recibimos el identificador de la transacción para validarla.',
  'confirm-error': 'Hubo un problema al confirmar el pago con Webpay.',
}

export default async function PaymentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const message = REASONS[params.reason ?? ''] ?? 'No pudimos activar tu plan. Puedes intentar nuevamente.'

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <BrandLockup compact />

        <Card className="mt-10 w-full rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-center px-6 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              No pudimos confirmar tu pago
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              {message}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/precios">
                <Button className="rounded-xl">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Intentar nuevamente
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-xl border-border">Volver al dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
