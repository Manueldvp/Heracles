import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import ApplyTrainerForm from '@/components/trainers/ApplyTrainerForm'
import { createClient } from '@/lib/supabase/server'
import { getPublicTrainerProfileById } from '@/lib/public-trainers'

export default async function ApplyTrainerPage({
  params,
}: {
  params: Promise<{ trainerId: string }>
}) {
  const { trainerId } = await params
  const supabase = await createClient()
  const { data: trainer } = await getPublicTrainerProfileById(supabase, trainerId)

  if (!trainer) notFound()

  const trainerName = trainer.full_name ?? trainer.username

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href={`/trainer/${trainer.username}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Volver al perfil público
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="rounded-[28px] border-border bg-card">
            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 border border-border bg-muted/40">
                  {trainer.avatar_url ? <AvatarImage src={trainer.avatar_url} alt={trainerName} /> : null}
                  <AvatarFallback>{trainerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Aplicar</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                    Trabajar con {trainerName}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                    Completa este formulario y generaremos tu solicitud directamente dentro del sistema del entrenador.
                    Si ya tienes cuenta, se vinculará de inmediato. Si no, se creará una invitación pendiente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ApplyTrainerForm trainerId={trainer.id} trainerName={trainerName} />
        </div>
      </div>
    </div>
  )
}
