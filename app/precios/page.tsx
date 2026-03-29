import Link from 'next/link'
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UpgradeButton from '@/components/pricing/upgrade-button'

const plans = [
  {
    name: 'Free',
    description: 'Para empezar y validar tu operación.',
    price: '$0',
    cadence: '/mes',
    planType: 'free' as const,
    clients: '5 clientes',
    ai: '3 usos IA',
    features: ['Invitaciones y onboarding', 'Seguimiento base', 'Panel de cliente'],
  },
  {
    name: 'Pro',
    description: 'Para entrenadores que ya tienen una cartera activa.',
    price: 'Configura en Stripe',
    cadence: '',
    planType: 'pro' as const,
    clients: '20 clientes',
    ai: '50 usos IA',
    features: ['Checkout por suscripción', 'Más capacidad operativa', 'Límites pensados para crecer'],
  },
  {
    name: 'Studio',
    description: 'Para equipos o coaches con más volumen.',
    price: 'Configura en Stripe',
    cadence: '',
    planType: 'studio' as const,
    clients: '50 clientes',
    ai: 'IA ilimitada',
    features: ['Mayor escala', 'Sin fricción de uso IA', 'Ideal para operación premium'],
  },
] as const

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-5">
          <BrandLockup compact />
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Inicio</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl">Empieza gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Precios</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              Elige el plan que acompana tu crecimiento
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Treinex mantiene una entrada simple: Free para empezar, Pro para escalar y Studio para operar con más volumen sin quedarte corto en clientes ni IA.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={`rounded-xl border-border bg-card ${plan.planType !== 'free' ? 'shadow-sm' : ''}`}>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl font-semibold text-foreground">{plan.name}</CardTitle>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      {plan.planType === 'studio' ? <Sparkles className="h-4 w-4 text-primary" /> : plan.planType === 'pro' ? <Zap className="h-4 w-4 text-primary" /> : <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-3xl font-bold text-foreground">{plan.price}</p>
                    {plan.cadence ? <p className="mt-1 text-sm text-muted-foreground">{plan.cadence}</p> : null}
                    <p className="mt-4 text-sm text-foreground">{plan.clients}</p>
                    <p className="mt-1 text-sm text-foreground">{plan.ai}</p>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <p className="text-sm text-muted-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>

                  {plan.planType === 'free' ? (
                    <Link href="/register" className="block">
                      <Button variant="outline" className="w-full rounded-xl border-border">Empezar con Free</Button>
                    </Link>
                  ) : (
                    <UpgradeButton
                      planType={plan.planType}
                      label={plan.planType === 'studio' ? 'Actualizar a Studio' : 'Actualizar a Pro'}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
