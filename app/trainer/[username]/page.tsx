import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Award, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPublicTrainerProfile } from '@/lib/public-trainers'
import PublicTrainerActions from '@/components/trainers/PublicTrainerActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

async function loadTrainer(username: string) {
  const supabase = await createClient()
  const result = await getPublicTrainerProfile(supabase, username)
  return result.data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const trainer = await loadTrainer(username)

  if (!trainer) {
    return {
      title: 'Entrenador no encontrado',
    }
  }

  return {
    title: trainer.full_name ?? trainer.username,
    description: trainer.specialty
      ? `${trainer.specialty}. Conoce el perfil público y trabaja con ${trainer.full_name ?? trainer.username}.`
      : `Conoce el perfil público de ${trainer.full_name ?? trainer.username}.`,
  }
}

export default async function PublicTrainerPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const trainer = await loadTrainer(username)

  if (!trainer) notFound()

  const trainerName = trainer.full_name ?? trainer.username

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden rounded-[28px] border-border bg-card">
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 border border-border bg-muted/40 sm:h-28 sm:w-28">
                  {trainer.avatar_url ? <AvatarImage src={trainer.avatar_url} alt={trainerName} /> : null}
                  <AvatarFallback className="text-2xl">
                    {trainerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                    Perfil público
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
                    {trainerName}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                    {trainer.bio || 'Entrenador personal enfocado en transformar hábitos, rendimiento y adherencia a largo plazo.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-sm text-muted-foreground">Especialidad</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {trainer.specialty || 'Entrenamiento personalizado'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-sm text-muted-foreground">Clientes activos</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{trainer.active_clients}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Certificaciones</p>
                </div>

                {trainer.certifications && trainer.certifications.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trainer.certifications.map((certification) => (
                      <Badge key={certification} variant="outline" className="rounded-full px-3 py-1">
                        {certification}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Este entrenador aún no ha publicado sus certificaciones.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[28px] border-border bg-card">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{trainer.total_clients} clientes totales</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Empieza a trabajar con {trainerName.split(' ')[0]}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Solicita información, resuelve tus dudas por WhatsApp o inicia directamente tu proceso de incorporación.
              </p>
              <PublicTrainerActions
                className="mt-6"
                trainerId={trainer.id}
                trainerName={trainerName}
                whatsappNumber={trainer.whatsapp_number}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
