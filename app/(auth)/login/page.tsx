'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageLoader from '@/components/ui/page-loader'
import { createClient } from '@/lib/supabase/client'
import { createTranslator, getTranslationValue } from '@/lib/i18n'
import ThemeToggle from '@/components/theme-toggle'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const token = searchParams.get('token')
  const t = createTranslator('es')
  const benefits = getTranslationValue<string[]>('auth.login.benefits', 'es')
  const metrics = getTranslationValue<Array<{ label: string; value: string }>>('auth.login.metrics', 'es')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.login.errors.required'))
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(t('auth.login.errors.invalid_credentials'))
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError(t('auth.login.errors.session'))
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'trainer') {
      router.push('/dashboard')
      return
    }

    if (profile?.role === 'client') {
      router.push(token ? `/onboarding/${token}` : '/client')
      return
    }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (clientRow) {
      router.push(token ? `/onboarding/${token}` : '/client')
      return
    }

    router.push('/dashboard')
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('auth.login.errors.enter_email_first'))
      return
    }

    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}` })
    setResetSent(true)
    setError('')
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <section className="relative hidden rounded-[32px] border border-border bg-card/85 p-8 backdrop-blur-sm sm:p-10 lg:block">
          <div className="absolute right-6 top-6">
            <ThemeToggle />
          </div>
          <BrandLockup subtitle={t('common.tagline')} />

          <div className="mt-14 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">{t('common.app_name')}</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              {t('auth.login.headline')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t('auth.login.description')}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-border bg-card/80">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{metric.label}</p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-foreground">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-border bg-card/70 px-4 py-4">
                <p className="text-sm leading-7 text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-md items-center justify-center">
          <Card className="w-full border-border bg-card/95 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                <BrandLockup compact className="min-w-0" />
                <ThemeToggle />
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  {t('auth.login.title')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t('auth.login.subtitle')}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('auth.shared.email')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
                      placeholder={t('auth.login.email_placeholder')}
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
                      onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
                      placeholder={t('auth.login.password_placeholder')}
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
                </div>

                {error ? (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                {resetSent ? (
                  <p className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {t('auth.login.reset_sent')}
                  </p>
                ) : null}

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                </Button>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-muted-foreground transition hover:text-primary"
                  >
                    {t('auth.login.forgot_password')}
                  </button>
                  <Link
                    href={token ? `/register?token=${token}` : '/register'}
                    className="text-xs text-primary transition hover:text-primary-hover"
                  >
                    {t('auth.login.create_account')}
                  </Link>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground">{t('common.copyright')}</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<PageLoader className="min-h-screen bg-background" compact />}
    >
      <LoginForm />
    </Suspense>
  )
}
