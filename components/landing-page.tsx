import Link from 'next/link'
import { ArrowRight, CheckCircle2, Dumbbell, LineChart, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'

const features = [
  {
    icon: Users,
    title: 'Clientes organizados',
    copy: 'Invitaciones, onboarding, progreso y seguimiento en un solo lugar.',
  },
  {
    icon: Dumbbell,
    title: 'Rutinas más visuales',
    copy: 'Entrega ejercicios, bloques y estructura clara para que el cliente ejecute mejor.',
  },
  {
    icon: MessageSquareText,
    title: 'Comunicación activa',
    copy: 'Notificaciones y recordatorios para mantener a tus clientes conectados.',
  },
  {
    icon: LineChart,
    title: 'Escala con datos',
    copy: 'Centraliza check-ins, cumplimiento y progreso sin hojas sueltas.',
  },
]

const proofPoints = [
  'Invita clientes y asígnales formularios al registrarse',
  'Entrega rutinas y nutrición desde una experiencia más clara',
  'Haz seguimiento semanal sin perseguir mensajes dispersos',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_20px_60px_rgba(249,115,22,0.35)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-orange-300">{APP_NAME.toUpperCase()}</p>
              <p className="text-xs text-zinc-500">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-300 hover:bg-zinc-900 hover:text-white">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-orange-500 text-white hover:bg-orange-600">Register</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-300">
              Plataforma para entrenadores que quieren crecer sin perder claridad
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Convierte tu servicio en una experiencia premium para cada cliente.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-400">
                Treinex te ayuda a gestionar invitaciones, onboarding, rutinas, nutrición y seguimiento
                desde un espacio más ordenado, visual y fácil de escalar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full bg-orange-500 text-white hover:bg-orange-600 sm:w-auto">
                  Crear cuenta
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full border-zinc-700 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-900 sm:w-auto">
                  Iniciar sesión
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {proofPoints.map(point => (
                <div key={point} className="flex items-start gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-400" />
                  <p className="text-sm leading-6 text-zinc-300">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-zinc-800 bg-zinc-950/75 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
            <CardContent className="space-y-5 p-6">
              <div className="rounded-3xl border border-zinc-800 bg-[linear-gradient(180deg,rgba(24,24,27,1),rgba(9,9,11,1))] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Panel del entrenador</p>
                    <p className="text-xl font-semibold text-white">Operación más ordenada</p>
                  </div>
                  <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
                    Activo
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-white">Onboarding y formularios</p>
                      <ShieldCheck size={16} className="text-blue-400" />
                    </div>
                    <p className="text-sm leading-6 text-zinc-400">
                      Asigna el formulario correcto desde la invitación y recoge información útil desde el primer acceso.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-sm font-medium text-white">Notificaciones</p>
                      <p className="mt-2 text-3xl font-semibold text-orange-300">0 desync</p>
                      <p className="mt-2 text-xs text-zinc-500">Lectura y badge sincronizados</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                      <p className="text-sm font-medium text-white">Experiencia del cliente</p>
                      <p className="mt-2 text-3xl font-semibold text-blue-300">Media-ready</p>
                      <p className="mt-2 text-xs text-zinc-500">Ejercicios más claros y accionables</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Features</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Lo esencial para crecer sin fricción</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map(feature => (
              <Card key={feature.title} className="border-zinc-800 bg-zinc-950/75">
                <CardContent className="space-y-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-orange-300">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.copy}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
