import Link from 'next/link'
import { ArrowRight, Check, CreditCard, Sparkles, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WebpayUpgradeButton from '@/components/pricing/webpay-upgrade-button'
import { getPlanLabel, getTrainerBillingStatus, type PlanType } from '@/lib/billing'
import { formatClp, getWebpayPlanSummary } from '@/lib/webpay'
import { createClient } from '@/lib/supabase/server'

const planOrder: PlanType[] = ['free', 'pro', 'studio']

const plans = [
  {
    name: 'Free',
    description: 'Para empezar a operar y validar tu flujo.',
    planType: 'free' as const,
    icon: CreditCard,
    amount: '$0',
    cadence: '/mes',
    features: ['Hasta 5 clientes', '3 usos de IA al mes', 'Acceso completo al producto base'],
  },
  {
    name: 'Pro',
    description: 'Para entrenadores con cartera activa y más volumen operativo.',
    planType: 'pro' as const,
    icon: Zap,
    amount: formatClp(getWebpayPlanSummary('pro').amount),
    cadence: '/mes',
    features: ['Hasta 20 clientes', '50 usos de IA al mes', 'Ideal para crecer sin fricción'],
  },
  {
    name: 'Studio',
    description: 'Para coaches y equipos que trabajan a escala.',
    planType: 'studio' as const,
    icon: Sparkles,
    amount: formatClp(getWebpayPlanSummary('studio').amount),
    cadence: '/mes',
    features: ['Hasta 50 clientes', 'IA ilimitada', 'Pensado para operación premium'],
  },
] as const

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const billing = await getTrainerBillingStatus(supabase, user.id)
  const currentPlanIndex = planOrder.indexOf(billing.subscription.planType)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Billing</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">
              Gestiona tu plan y escala con claridad
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Los upgrades se procesan de forma segura con Webpay y se activan sólo después de que Transbank confirme la transacción.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plan actual</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{getPlanLabel(billing.subscription.planType)}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clientes</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {billing.clientCount}/{billing.subscription.clientLimit ?? 'Ilimitado'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">IA disponible</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {billing.aiGenerationsRemaining ?? 'Ilimitada'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Resumen de tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Estado de suscripción</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billing.subscription.active ? 'Tu plan está activo y listo para usar.' : 'Tu suscripción necesita atención.'}
                  </p>
                </div>
                <Badge>{billing.subscription.active ? 'Activo' : 'Pendiente'}</Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Capacidad de clientes</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billing.remainingClientSlots === null
                      ? 'Tu plan actual no limita nuevas altas.'
                      : `Te quedan ${billing.remainingClientSlots} cupos antes de bloquear nuevas invitaciones.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Uso de IA</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {billing.aiGenerationsRemaining === null
                      ? 'Tu plan incluye IA ilimitada este mes.'
                      : `Has usado ${billing.aiGenerationsUsed} de ${billing.subscription.aiLimit} generaciones este mes.`}
                  </p>
                </div>
              </div>
            </div>

            <Link href="/dashboard/profile" className="inline-flex">
              <Button variant="outline" className="rounded-xl border-border">
                Ver perfil y plan actual
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const planIndex = planOrder.indexOf(plan.planType)
            const isCurrent = plan.planType === billing.subscription.planType
            const isDowngradeOrSame = planIndex <= currentPlanIndex
            const isPaidPlan = plan.planType !== 'free'
            const Icon = plan.icon

            return (
              <Card key={plan.name} className="rounded-2xl border border-border bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl font-semibold text-foreground">{plan.name}</CardTitle>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-3xl font-bold text-foreground">{plan.amount}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.cadence}</p>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <p className="text-sm text-muted-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <Button disabled className="w-full rounded-xl">
                      Plan actual
                    </Button>
                  ) : !isPaidPlan ? (
                    <Button variant="outline" disabled className="w-full rounded-xl border-border">
                      Disponible en tu cuenta
                    </Button>
                  ) : isDowngradeOrSame ? (
                    <Button variant="outline" disabled className="w-full rounded-xl border-border">
                      No disponible desde tu plan actual
                    </Button>
                  ) : (
                    <WebpayUpgradeButton
                      planType={plan.planType}
                      label={plan.planType === 'studio' ? 'Pagar Studio con Webpay' : 'Pagar Pro con Webpay'}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
