'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Intentar setear sesión desde el hash de la URL
    const handleHash = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error) setReady(true)
        return
      }

      // Si no hay hash verificar si ya hay sesión activa con recovery
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setReady(true)
    }

    handleHash()

    // También escuchar el evento de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    router.push(profile?.role === 'client' ? '/client' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Nueva contraseña</CardTitle>
            <p className="text-zinc-400 text-sm">Ingresa tu nueva contraseña</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!ready ? (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm">Verificando link...</p>
                <p className="text-zinc-600 text-xs mt-2">
                  Si esto tarda mucho,{' '}
                  <a href="/forgot-password" className="text-orange-500 hover:underline">
                    solicita un nuevo link
                  </a>
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-400">Nueva contraseña</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-400">Confirmar contraseña</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button
                  onClick={handleReset}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                >
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}