'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleDashed, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Step = {
  key: 'created_client' | 'created_routine' | 'assigned_routine'
  label: string
  description: string
  href: string
}

export default function OnboardingCard({
  progress,
  firstClientId,
}: {
  progress: {
    created_client: boolean
    created_routine: boolean
    assigned_routine: boolean
    completed: boolean
  }
  firstClientId?: string | null
}) {
  const [hidden, setHidden] = useState(progress.completed)
  const [skipping, setSkipping] = useState(false)

  const steps: Step[] = useMemo(() => [
    {
      key: 'created_client',
      label: 'Crear cliente',
      description: 'Invita tu primer cliente para empezar a operar en Treinex.',
      href: '/dashboard/clients',
    },
    {
      key: 'created_routine',
      label: 'Crear rutina',
      description: 'Genera una rutina manual, con IA o usando una plantilla.',
      href: firstClientId ? `/dashboard/clients/${firstClientId}/routines/new` : '/dashboard/clients',
    },
    {
      key: 'assigned_routine',
      label: 'Asignar rutina',
      description: 'Entrega la rutina para que el cliente ya pueda empezar.',
      href: firstClientId ? `/dashboard/clients/${firstClientId}` : '/dashboard/clients',
    },
  ], [firstClientId])

  const completedSteps = steps.filter((step) => progress[step.key]).length
  const progressPercent = Math.round((completedSteps / steps.length) * 100)

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await fetch('/api/onboarding/skip', { method: 'POST' })
      setHidden(true)
    } finally {
      setSkipping(false)
    }
  }

  if (hidden) return null

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm transition duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm text-primary">Primeros pasos</p>
            </div>
            <CardTitle className="mt-2 text-lg font-semibold text-foreground">Activa tu cuenta en minutos</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={skipping} className="text-muted-foreground hover:text-foreground">
            {skipping ? 'Ocultando...' : 'Omitir'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Progreso de activación</p>
            <p className="text-sm font-medium text-foreground">{completedSteps}/{steps.length}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => {
            const done = progress[step.key]
            return (
              <div
                key={step.key}
                className={`rounded-xl border p-4 transition duration-300 ${
                  done
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border bg-muted/20 hover:border-primary/20 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    done ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                    {done ? 'Hecho' : 'Pendiente'}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">{step.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                {!done ? (
                  <Link href={step.href} className="mt-4 inline-flex items-center text-sm font-medium text-primary transition hover:text-primary-hover">
                    Ir al paso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
