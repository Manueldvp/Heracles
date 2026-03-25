import Link from 'next/link'
import { ArrowRight, BarChart3, BellRing, LayoutDashboard, Sparkles, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 sm:px-8 lg:px-10">
          <header className="sticky top-0 z-20 rounded-2xl border border-border bg-background/85 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <BrandLockup subtitle={t('common.tagline')} compact />

              <nav className="hidden items-center gap-8 md:flex">
                <span className="text-sm font-medium text-primary">{t('landing.nav.platform')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.coaching')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.pricing')}</span>
                <span className="text-sm text-muted-foreground">{t('landing.nav.about')}</span>
              </nav>

              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
                    {t('common.start_free')}
                  </Button>
                </Link>
                <ThemeToggle />
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
                <div className="rounded-[28px] border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('landing.snapshot.eyebrow')}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{t('landing.snapshot.title')}</p>
                    </div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                      {t('landing.snapshot.status')}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="rounded-3xl border border-border bg-muted/30 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="h-1 w-14 rounded-full bg-primary" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-primary/10">
                          <LayoutDashboard className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <p className="mt-5 text-base font-semibold text-foreground">{t('landing.snapshot.primary_title')}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t('landing.snapshot.primary_copy')}
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Clientes</p>
                          <p className="mt-2 text-lg font-semibold text-white">24 activos</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Check-ins</p>
                          <p className="mt-2 text-lg font-semibold text-white">18 recibidos</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Adherencia</p>
                          <p className="mt-2 text-lg font-semibold text-white">87%</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {snapshotSecondary.map((item) => (
                        <div key={item.title} className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{item.title}</p>
                          <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">{item.value}</p>
                          <p className="mt-2 text-sm text-zinc-500">{item.copy}</p>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                            <div className={`h-full rounded-full ${item.title === 'Notificaciones' ? 'w-[82%] bg-orange-500' : 'w-[68%] bg-blue-400'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
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

      <section className="border-b border-zinc-900 bg-zinc-950/60 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
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

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
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

      <section className="border-y border-zinc-900 bg-zinc-950/60 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
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

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.28),transparent_24%),linear-gradient(180deg,#111111_0%,#090909_100%)] p-10 sm:p-14 lg:p-20">
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

      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
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
