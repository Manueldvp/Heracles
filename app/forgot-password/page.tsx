'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email) {
      setError('Ingresa tu email')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/reset-password'
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Restablecer contraseña</CardTitle>
            <p className="text-zinc-400 text-sm">
              Te enviaremos un link para crear una nueva contraseña
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {sent ? (
              <div className="text-center py-4 flex flex-col gap-3">
                <p className="text-green-400 font-semibold">✓ Email enviado</p>
                <p className="text-zinc-400 text-sm">
                  Revisa tu bandeja de entrada y sigue las instrucciones.
                </p>
                <Link href="/login" className="text-orange-500 hover:underline text-sm">
                  ← Volver al login
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </Button>

                <Link
                  href="/login"
                  className="text-zinc-500 text-sm hover:text-zinc-300 transition text-center"
                >
                  ← Volver al login
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}