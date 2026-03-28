import Link from 'next/link'
import { ArrowRight, CheckCircle2, LucideIcon } from 'lucide-react'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type VisualCard = {
  title: string
  copy: string
  image: string
}

type SectionItem = {
  title: string
  copy: string
  icon: LucideIcon
}

export default function MarketingPageShell({
  eyebrow,
  title,
  description,
  heroPoints,
  sections,
  visuals,
}: {
  eyebrow: string
  title: string
  description: string
  heroPoints: string[]
  sections: SectionItem[]
  visuals: VisualCard[]
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-5">
          <BrandLockup compact />
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Inicio
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl">Empieza gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-screen-xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground lg:mx-0 lg:text-lg">
                {description}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                <Link href="/register">
                  <Button size="lg" className="w-full rounded-xl px-8 sm:w-auto">
                    Empieza gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/precios">
                  <Button size="lg" variant="outline" className="w-full rounded-xl border-border px-8 sm:w-auto">
                    Ver precios
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroPoints.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 lg:mx-0">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {visuals.map((visual) => (
                <Card key={visual.title} className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
                  <CardContent className="grid gap-0 p-0 sm:grid-cols-[0.46fr_0.54fr]">
                    <div
                      className="min-h-[180px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${visual.image})` }}
                    />
                    <div className="flex flex-col justify-center p-6">
                      <p className="text-lg font-semibold text-foreground">{visual.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{visual.copy}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-4 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-screen-xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Cómo se ve en Treinex</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
                Diseño claro, estructura premium y foco en ejecución
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {sections.map(({ title, copy, icon: Icon }) => (
                <Card key={title} className="rounded-xl border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <CardContent className="p-6 text-center md:text-left">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 md:mx-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
