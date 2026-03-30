import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { normalizePlanType, getPlanLabel } from '@/lib/billing'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const params = await searchParams
  const planType = normalizePlanType(params.plan)

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <BrandLockup compact />

        <Card className="mt-10 w-full rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-center px-6 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pago aprobado
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Tu plan {getPlanLabel(planType)} ya está activo
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              Validamos el pago con Webpay y actualizamos tu suscripción. Ya puedes volver al dashboard y seguir trabajando con tus nuevos límites.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button className="rounded-xl">Ir al dashboard</Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline" className="rounded-xl border-border">Ver mi plan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
