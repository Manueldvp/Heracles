'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const goalOptions = [
  { value: 'general', label: 'Mejorar mi condicion general' },
  { value: 'muscle_gain', label: 'Ganar masa muscular' },
  { value: 'fat_loss', label: 'Perder grasa' },
  { value: 'strength', label: 'Aumentar fuerza' },
  { value: 'endurance', label: 'Mejorar resistencia' },
]

type Props = {
  trainerId: string
  trainerName: string
}

export default function ApplyTrainerForm({ trainerId, trainerName }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    goal: 'general',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setInviteUrl(null)

    try {
      const response = await fetch('/api/public-trainers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          goal: form.goal,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo enviar tu solicitud.')
      }

      setSuccess(payload.message ?? `Tu solicitud para entrenar con ${trainerName} fue enviada correctamente.`)
      setInviteUrl(typeof payload.inviteUrl === 'string' ? payload.inviteUrl : null)
      setForm({
        fullName: '',
        email: '',
        goal: 'general',
      })
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar tu solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Solicitar informacion</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <select
              id="goal"
              value={form.goal}
              onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <p>{success}</p>
              {inviteUrl ? (
                <Link href={inviteUrl} className="mt-2 inline-flex font-medium text-emerald-300 underline underline-offset-4">
                  Continuar con mi registro
                </Link>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando solicitud...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar solicitud
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
