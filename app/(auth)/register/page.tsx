'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BrandLockup from '@/components/brand-lockup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTranslator, getTranslationValue } from '@/lib/i18n'

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
      <div className="min-h-screen bg-black px-4 text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
          <Card className="w-full border-zinc-900 bg-zinc-950/90">
            <CardContent className="p-8 text-center sm:p-10">
              <BrandLockup subtitle={t('common.tagline')} compact className="justify-center" />
              <div className="mx-auto mt-8 h-14 w-14 rounded-full border border-orange-500/20 bg-orange-500/10" />
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.05em] text-white">
                {t('auth.register.confirmation.title')}
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {isClient
                  ? t('auth.register.confirmation.description_client', { email })
                  : t('auth.register.confirmation.description_trainer', { email })}
              </p>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4">
                <p className="text-sm text-zinc-400">
                  {t('auth.register.confirmation.resend_prefix')}
                  <button
                    type="button"
                    onClick={() => setRegistered(false)}
                    className="ml-1 text-orange-300 transition hover:text-orange-200"
                  >
                    {t('auth.register.confirmation.retry')}
                  </button>
                  .
                </p>
              </div>

              <Link href="/login" className="mt-8 inline-block text-sm text-zinc-500 transition hover:text-zinc-300">
                {t('common.back_to_login')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10">
        <section className="mx-auto w-full max-w-md lg:order-2">
          <Card className="border-zinc-900 bg-zinc-950/90">
            <CardContent className="p-8 sm:p-10">
              <BrandLockup subtitle={t('common.tagline')} compact className="mb-10 lg:hidden" />

              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white">
                  {isClient ? t('auth.register.title_client') : t('auth.register.title_trainer')}
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {isClient ? t('auth.register.subtitle_client') : t('auth.register.subtitle_trainer')}
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('auth.shared.full_name')}</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('auth.register.name_placeholder')}
                    className="h-12 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('auth.shared.email')}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t('auth.register.email_placeholder')}
                    className="h-12 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('auth.shared.password')}</Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-xs text-zinc-500 transition hover:text-zinc-300"
                    >
                      {showPassword ? t('auth.shared.hide') : t('auth.shared.show')}
                    </button>
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleRegister()}
                    placeholder={t('auth.register.password_placeholder')}
                    className="h-12 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500"
                  />
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
                      <span className="text-xs text-zinc-400">{strengthLabels[passwordStrength]}</span>
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
                  className="h-12 w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  {loading
                    ? t('auth.register.submitting')
                    : isClient
                      ? t('auth.register.submit_client')
                      : t('auth.register.submit_trainer')}
                </Button>

                <div className="pt-2 text-center">
                  <span className="text-xs text-zinc-500">{t('auth.register.already_have_account')} </span>
                  <Link
                    href={isClient ? `/login?token=${token}` : '/login'}
                    className="text-xs text-orange-300 transition hover:text-orange-200"
                  >
                    {t('auth.register.login_link')}
                  </Link>
                </div>
              </div>

              <p className="mt-10 text-center text-xs text-zinc-600">{t('common.copyright')}</p>
            </CardContent>
          </Card>
        </section>

        {!isClient ? (
          <section className="rounded-[32px] border border-zinc-900 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_28%),linear-gradient(180deg,#111111_0%,#080808_100%)] p-8 sm:p-10 lg:order-1">
            <BrandLockup subtitle={t('common.tagline')} />

            <div className="mt-14 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-300">{t('common.app_name')}</p>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                {t('auth.register.headline')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                {t('auth.register.description')}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-zinc-800 bg-zinc-950/70">
                  <CardContent className="p-5">
                    <div className="h-1 w-12 rounded-full bg-orange-500" />
                    <p className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">{benefit.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{benefit.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
              <p className="text-sm text-zinc-300">{t('auth.register.social_proof')}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const t = createTranslator('es')

  return (
    <Suspense
      fallback={(
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-zinc-500">{t('common.loading')}</p>
        </div>
      )}
    >
      <RegisterForm />
    </Suspense>
  )
}
