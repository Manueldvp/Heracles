'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageLoader from '@/components/ui/page-loader'
import { persistInviteToken } from '@/lib/auth/client-routing'
import { createTranslator, getTranslationValue } from '@/lib/i18n'
import ThemeToggle from '@/components/theme-toggle'

type Benefit = {
  title: string
  desc: string
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const isClient = Boolean(token)
  const t = createTranslator('es')
  const benefits = getTranslationValue<Benefit[]>('auth.register.benefits', 'es')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    persistInviteToken(token)
  }, [token])

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError(t('auth.register.errors.required'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.register.errors.password_length'))
      return
    }

    setLoading(true)
    setError('')

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role: isClient ? 'client' : 'trainer',
        token,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error ?? t('auth.register.errors.generic'))
      setLoading(false)
      return
    }

    setRegistered(true)
    setLoading(false)
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['', t('auth.register.strength.weak'), t('auth.register.strength.medium'), t('auth.register.strength.strong')]

  if (registered) {
    return (
      <div className="min-h-screen bg-background px-4 text-foreground">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
          <Card className="w-full border-border bg-card">
            <CardContent className="p-8 text-center sm:p-10">
              <BrandLockup compact className="justify-center" />
              <div className="mx-auto mt-8 h-14 w-14 rounded-full border border-primary/20 bg-primary/10" />
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                {t('auth.register.confirmation.title')}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {isClient
                  ? t('auth.register.confirmation.description_client', { email })
                  : t('auth.register.confirmation.description_trainer', { email })}
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-muted/40 px-4 py-4">
                <p className="text-sm text-muted-foreground">
                  {t('auth.register.confirmation.resend_prefix')}
                  <button
                    type="button"
                    onClick={() => setRegistered(false)}
                    className="ml-1 text-primary transition hover:text-primary-hover"
                  >
                    {t('auth.register.confirmation.retry')}
                  </button>
                  .
                </p>
              </div>

              <Link href="/login" className="mt-8 inline-block text-sm text-muted-foreground transition hover:text-foreground">
                {t('common.back_to_login')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <section className="mx-auto w-full max-w-md lg:order-2">
          <Card className="w-full border-border bg-card/95 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <BrandLockup compact className="min-w-0 lg:hidden" />
                <ThemeToggle />
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  {isClient ? t('auth.register.title_client') : t('auth.register.title_trainer')}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {isClient ? t('auth.register.subtitle_client') : t('auth.register.subtitle_trainer')}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('auth.shared.full_name')}</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t('auth.register.name_placeholder')}
                      className="h-12 border-border bg-background pl-11 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('auth.shared.email')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t('auth.register.email_placeholder')}
                      className="h-12 border-border bg-background pl-11 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('auth.shared.password')}</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleRegister()}
                      placeholder={t('auth.register.password_placeholder')}
                      className="h-12 border-border bg-background pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 ? (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className={`h-1.5 flex-1 rounded-full ${item <= passwordStrength ? strengthColors[passwordStrength] : 'bg-zinc-800'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</span>
                    </div>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  {loading
                    ? t('auth.register.submitting')
                    : isClient
                      ? t('auth.register.submit_client')
                      : t('auth.register.submit_trainer')}
                </Button>

                <div className="pt-2 text-center">
                  <span className="text-xs text-muted-foreground">{t('auth.register.already_have_account')} </span>
                  <Link
                    href={isClient ? `/login?token=${token}` : '/login'}
                    className="text-xs text-primary transition hover:text-primary-hover"
                  >
                    {t('auth.register.login_link')}
                  </Link>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground">{t('common.copyright')}</p>
            </CardContent>
          </Card>
        </section>

        {!isClient ? (
          <section className="hidden rounded-[32px] border border-border bg-card/85 p-8 backdrop-blur-sm sm:p-10 lg:order-1 lg:block">
            <BrandLockup subtitle={t('common.tagline')} />

            <div className="mt-14 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">{t('common.app_name')}</p>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
                {t('auth.register.headline')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('auth.register.description')}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-border bg-card/80">
                  <CardContent className="p-5">
                    <div className="h-1 w-12 rounded-full bg-primary" />
                    <p className="mt-5 text-lg font-semibold tracking-[-0.03em] text-foreground">{benefit.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card/80 px-5 py-4">
              <p className="text-sm text-muted-foreground">{t('auth.register.social_proof')}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<PageLoader className="min-h-screen bg-background" compact />}
    >
      <RegisterForm />
    </Suspense>
  )
}
