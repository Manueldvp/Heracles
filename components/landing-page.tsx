import Link from 'next/link'
import { ArrowRight, BarChart3, BellRing, LayoutDashboard, Menu, Sparkles, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import BrandLockup from '@/components/brand-lockup'
import FeatureCard from '@/components/landing/feature-card'
import LandingCarousel from '@/components/landing/landing-carousel'
import ThemeToggle from '@/components/theme-toggle'
import { createTranslator, getTranslationValue } from '@/lib/i18n'

type LandingItem = {
  title: string
  copy: string
}

type CarouselItem = {
  name: string
  role: string
  description: string
  image: string
}

export default function LandingPage() {
  const t = createTranslator('es')
  const heroProofPoints = getTranslationValue<string[]>('landing.hero.proof_points', 'es')
  const valueItems = getTranslationValue<LandingItem[]>('landing.value.items', 'es')
  const featureItems = getTranslationValue<LandingItem[]>('landing.features.items', 'es')
  const carouselItems = getTranslationValue<CarouselItem[]>('landing.carousel.items', 'es')
  const snapshotSecondary = getTranslationValue<Array<{ title: string; value: string; copy: string }>>('landing.snapshot.secondary', 'es')
  const featureIcons = [UsersRound, LayoutDashboard, Sparkles, BellRing]
  const mobileLinks = [
    { href: '#valor', label: 'Coaching' },
    { href: '#precios', label: 'Precios' },
    { href: '/login', label: t('common.login') },
    { href: '/register', label: t('common.start_free') },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-4 pb-24 pt-6">
          <header className="sticky top-0 z-20 rounded-2xl border border-border bg-background/85 px-4 py-4 backdrop-blur sm:px-5">
            <div className="flex max-w-full items-center gap-3 overflow-x-hidden">
              <BrandLockup subtitle={t('common.tagline')} compact className="min-w-0" />

              <nav className="hidden items-center gap-8 md:flex">
                <span className="text-sm font-medium text-primary">{t('landing.nav.platform')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.coaching')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.pricing')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.about')}</span>
              </nav>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <div className="hidden items-center gap-2 md:flex">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-hover">
                      {t('common.start_free')}
                    </Button>
                  </Link>
                </div>
                <ThemeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[84vw] max-w-sm border-border bg-background">
                    <SheetHeader>
                      <SheetTitle>Navegación</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-3 px-4 pb-6">
                      {mobileLinks.map((item) => (
                        <SheetClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <section className="grid gap-12 pb-20 pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-4xl">
              <Badge className="mb-6 border-primary/20 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-primary">
                {t('landing.hero.badge')}
              </Badge>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl xl:text-8xl">
                {t('landing.hero.title')}
                <br />
                <span className="bg-gradient-to-r from-orange-200 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                  {t('landing.hero.title_emphasis')}
                </span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {t('landing.hero.description')}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary-hover sm:w-auto">
                    {t('common.start_free')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full border-border bg-card px-8 text-foreground hover:bg-accent sm:w-auto">
                    {t('common.login')}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Operación</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Más clara</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Seguimiento</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Más visible</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Escala</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Más control</p>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('landing.snapshot.eyebrow')}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{t('landing.snapshot.title')}</p>
                      </div>
                      <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                        {t('landing.snapshot.status')}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Clientes</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">24 activos</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Check-ins</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">18 recibidos</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Adherencia</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">87%</p>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-border bg-muted/30 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-1 w-14 rounded-full bg-primary" />
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                            <LayoutDashboard className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <p className="mt-5 text-base font-semibold text-foreground">{t('landing.snapshot.primary_title')}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {t('landing.snapshot.primary_copy')}
                        </p>

                        <div className="mt-5 grid gap-3">
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                            <span className="text-sm text-muted-foreground">Clientes con seguimiento activo</span>
                            <span className="text-sm font-semibold text-foreground">12</span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                            <span className="text-sm text-muted-foreground">Pendientes de revisión</span>
                            <span className="text-sm font-semibold text-foreground">3</span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                            <span className="text-sm text-muted-foreground">Alertas de adherencia</span>
                            <span className="text-sm font-semibold text-primary">2 críticas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {snapshotSecondary.map((item) => (
                      <div key={item.title} className="rounded-3xl border border-border bg-muted/30 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.title}</p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">{item.value}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{item.copy}</p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
                          <div className={`h-full rounded-full ${item.title === 'Notificaciones' ? 'w-[82%] bg-primary' : 'w-[68%] bg-chart-5'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {heroProofPoints.map((item) => (
              <div key={item} className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-5">
                <div className="h-1 w-12 rounded-full bg-orange-500" />
                <p className="mt-4 text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section id="valor" className="border-b border-border bg-muted/20 px-4 py-24">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t('landing.value.eyebrow')}</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {t('landing.value.title')}
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {valueItems.map((item) => (
              <Card key={item.title} className="border-zinc-800 bg-zinc-950/80">
                <CardContent className="p-6">
                  <div className="h-1 w-14 rounded-full bg-orange-500" />
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{item.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t('landing.features.eyebrow')}</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {t('landing.features.title')}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {featureItems.map((item, index) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                copy={item.copy}
                icon={featureIcons[index] ?? BarChart3}
                accent={index === 2 ? 'orange' : 'neutral'}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20 px-4 py-24">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">{t('landing.carousel.eyebrow')}</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {t('landing.carousel.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              {t('landing.carousel.description')}
            </p>
          </div>

          <div className="mt-12">
            <LandingCarousel items={carouselItems} />
          </div>
        </div>
      </section>

      <section id="precios" className="px-4 py-24">
        <div className="mx-auto w-full max-w-screen-xl overflow-hidden rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_24%),linear-gradient(180deg,var(--card)_0%,var(--background)_100%)] p-10 sm:p-14 lg:p-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">{t('landing.cta.eyebrow')}</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              {t('landing.cta.description')}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full bg-orange-500 px-8 text-white hover:bg-orange-600 sm:w-auto">
                  {t('landing.cta.primary')}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full border-zinc-700 bg-transparent px-8 text-zinc-100 hover:bg-white/5 sm:w-auto">
                  {t('landing.cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-4 py-16">
        <div className="mx-auto grid w-full max-w-screen-xl gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLockup subtitle={t('common.tagline')} />
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-500">{t('common.copyright')}</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t('landing.footer.product')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.features')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.security')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.pricing')}</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t('landing.footer.company')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.about')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.legal')}</p>
            <p className="text-sm text-zinc-400">{t('landing.footer.links.privacy')}</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t('landing.footer.access')}</p>
            <Link href="/login" className="block text-sm text-zinc-400 transition hover:text-white">{t('common.login')}</Link>
            <Link href="/register" className="block text-sm text-zinc-400 transition hover:text-white">{t('common.start_free')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
