'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
  const checkType = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const authType = sessionStorage.getItem('auth_type')
    setIsReset(authType === 'recovery')
    sessionStorage.removeItem('auth_type')
  }
  checkType()
}, [])

  const handleSetup = async () => {
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

    router.push('/client')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {isReset ? 'Nueva contraseña' : '¡Bienvenido! 💪'}
            </CardTitle>
            <p className="text-zinc-400 text-sm">
              {isReset
                ? 'Ingresa tu nueva contraseña'
                : 'Crea tu contraseña para acceder en el futuro'}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
              onClick={handleSetup}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              {loading ? 'Guardando...' : isReset ? 'Guardar contraseña' : 'Crear contraseña y entrar'}
            </Button>

            <a href="/login" className="text-zinc-500 text-sm hover:text-zinc-300 transition text-center">
              ← Volver al login
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}