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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_28%),linear-gradient(180deg,#0b0b0c_0%,#050505_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
        <section className="rounded-[32px] border border-zinc-900 bg-zinc-950/70 p-8 backdrop-blur-sm sm:p-10">
          <BrandLockup subtitle={t('common.tagline')} />

          <div className="mt-14 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">{t('common.app_name')}</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {t('auth.login.headline')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              {t('auth.login.description')}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-zinc-800 bg-zinc-950/70">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{metric.label}</p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-zinc-900 bg-zinc-950/60 px-4 py-4">
                <p className="text-sm leading-7 text-zinc-300">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <Card className="border-zinc-900 bg-zinc-950/90 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <CardContent className="p-8 sm:p-10">
              <BrandLockup subtitle={t('common.tagline')} compact className="mb-10 lg:hidden" />

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">
                  {t('auth.login.title')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {t('auth.login.subtitle')}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('auth.shared.email')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
                      placeholder={t('auth.login.email_placeholder')}
                      className="h-12 border-zinc-800 bg-zinc-900 pl-11 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500 focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.16)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('auth.shared.password')}</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
                      placeholder={t('auth.login.password_placeholder')}
                      className="h-12 border-zinc-800 bg-zinc-900 pl-11 pr-11 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500 focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.16)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-200"
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
                  className="h-12 w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                </Button>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-zinc-500 transition hover:text-orange-300"
                  >
                    {t('auth.login.forgot_password')}
                  </button>
                  <Link
                    href={token ? `/register?token=${token}` : '/register'}
                    className="text-xs text-orange-300 transition hover:text-orange-200"
                  >
                    {t('auth.login.create_account')}
                  </Link>
                </div>
              </div>

              <p className="mt-10 text-center text-xs text-zinc-600">{t('common.copyright')}</p>
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
      fallback={<PageLoader className="min-h-screen bg-black" compact />}
    >
      <LoginForm />
    </Suspense>
  )
}
