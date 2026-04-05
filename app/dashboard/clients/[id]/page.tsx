import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ClientExerciseProgress from './components/ClientExerciseProgress'
import ClientNotes from './components/ClientNotes'
import CheckinHistory from './progress/CheckinHistory'
import CheckinPhotoGallery from './components/CheckinPhotoGallery'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, Dumbbell, Salad, Pencil,
  ChevronRight, BarChart2, Plus, AlertTriangle, Clock
} from 'lucide-react'
import Link from 'next/link'
import DeleteClientButton from './components/DeleteClientButton'
import SubscriptionStatusCard from '@/components/subscriptions/subscription-status-card'
import {
  formatSubscriptionDate,
  summarizeClientSubscription,
} from '@/lib/client-subscriptions'
import ClientSubscriptionActions from './components/ClientSubscriptionActions'

type RoutineSummary = {
  title?: string
}

type NutritionSummary = {
  calories_target?: number
}

const goalLabel: Record<string, string> = {
  muscle_gain: 'Ganancia muscular',
  fat_loss: 'Pérdida de grasa',
  maintenance: 'Mantenimiento',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  general: 'General',
}

const goalColor: Record<string, string> = {
  muscle_gain: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fat_loss: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  maintenance: 'bg-green-500/20 text-green-400 border-green-500/30',
  strength: 'bg-red-500/20 text-red-400 border-red-500/30',
  endurance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  general: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const levelLabel: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const [
    { data: subscription },
    { data: routines },
    { data: nutritionPlans },
    { data: checkins },
    { data: exerciseLogs },
  ] = await Promise.all([
    supabase.from('client_subscriptions').select('*').eq('client_id', client.id).maybeSingle(),
    supabase.from('routines').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('nutrition_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('checkins').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('exercise_logs').select('exercise_name, max_weight').eq('client_id', client.id).order('max_weight', { ascending: false }).limit(1),
  ])

  const lastCheckin = checkins?.[0]
  const subscriptionSummary = summarizeClientSubscription(subscription)

  const weightCheckins = checkins?.filter(c => c.weight) ?? []
  const weightChange = weightCheckins.length >= 2
    ? +(weightCheckins[0].weight - weightCheckins[weightCheckins.length - 1].weight).toFixed(1)
    : null

  const now = new Date()
  const daysSinceCheckin = lastCheckin
    ? Math.floor((now.getTime() - new Date(lastCheckin.created_at).getTime()) / 86400000)
    : null

  const hasPainAlert = lastCheckin?.pain_zones?.length > 0
  const bestLift = exerciseLogs?.[0]
  const checkinPhotos = (checkins ?? [])
    .filter(checkin => checkin.photo_url)
    .map(checkin => ({
      id: checkin.id,
      url: checkin.photo_url as string,
      createdAt: checkin.created_at,
    }))

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center shrink-0 overflow-hidden">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-400 font-bold text-2xl">
                  {client.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {hasPainAlert && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={11} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.full_name}</h2>
            <p className="text-zinc-500 text-sm">{client.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-xs px-2 py-0.5 border ${goalColor[client.goal] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {goalLabel[client.goal] ?? client.goal}
              </Badge>
              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs px-2 py-0.5">
                {levelLabel[client.level] ?? client.level}
              </Badge>
              <Badge className={`text-xs px-2 py-0.5 border ${
                subscriptionSummary.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : subscriptionSummary.isPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {subscriptionSummary.label}
              </Badge>
              {daysSinceCheckin !== null && (
                <Badge className={`text-xs px-2 py-0.5 border ${
                  daysSinceCheckin <= 3 ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : daysSinceCheckin <= 7 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  <Clock size={10} className="inline mr-1" />
                  {daysSinceCheckin === 0 ? 'Check-in hoy' : `Hace ${daysSinceCheckin}d`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/dashboard/clients/${client.id}/progress`}>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-400">
              <TrendingUp size={14} className="mr-1.5" /> Progreso
            </Button>
          </Link>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
              <Pencil size={14} />
            </Button>
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.full_name} />
        </div>
      </div>

      <div className="mb-4">
        <SubscriptionStatusCard
          summary={subscriptionSummary}
          title="Acceso del cliente"
          body={
            subscriptionSummary.isActive
              ? `Acceso habilitado hasta ${formatSubscriptionDate(subscriptionSummary.endDate)}.`
              : subscriptionSummary.description
          }
          action={<ClientSubscriptionActions clientId={client.id} summary={subscriptionSummary} />}
        />
      </div>

      {/* Alerta dolor */}
      {hasPainAlert && (
        <Card className="bg-red-500/5 border-red-500/20 mb-4">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">
              Reportó dolor en: <span className="font-semibold">{lastCheckin.pain_zones.join(', ')}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Edad',   value: client.age ?? '—',                        unit: 'años',    color: 'text-white'      },
          { label: 'Peso',   value: client.weight ? `${client.weight}kg` : '—', unit: 'actual', color: 'text-orange-400' },
          { label: 'Altura', value: client.height ? `${client.height}cm` : '—', unit: 'estatura',color: 'text-blue-400'  },
          { label: 'Check-ins', value: checkins?.length ?? 0,                  unit: 'total',   color: 'text-purple-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <p className="mb-2 break-words text-zinc-600 text-xs">{stat.label}</p>
              <p className={`${stat.color} break-words font-bold text-xl sm:text-2xl`}>{stat.value}</p>
              <p className="mt-0.5 break-words text-zinc-700 text-xs">{stat.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notas privadas */}
      <div className="mb-4">
        <ClientNotes clientId={client.id} />
      </div>

      {bestLift && bestLift.max_weight > 0 && (
        <Card className="bg-blue-500/5 border-blue-500/20 mb-4">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300">Max strength</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {bestLift.max_weight}kg on {bestLift.exercise_name}
            </p>
            <p className="mt-1 text-sm text-zinc-500">Récord más alto registrado hasta ahora.</p>
          </CardContent>
        </Card>
      )}

      {/* Progreso de peso */}
      {weightChange !== null && (
        <Card className={`border mb-4 ${weightChange <= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <TrendingUp size={15} className={weightChange <= 0 ? 'text-green-400' : 'text-orange-400'} />
            <p className="text-zinc-300 text-sm">
              {weightChange <= 0
                ? `Ha bajado ${Math.abs(weightChange)}kg desde el primer registro`
                : `Ha subido ${weightChange}kg desde el primer registro`}
            </p>
            <Badge className={`ml-auto shrink-0 ${weightChange <= 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange}kg
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Restricciones */}
      {client.restrictions && (
        <Card className="bg-yellow-500/5 border-yellow-500/20 mb-4">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-200 text-sm">{client.restrictions}</p>
          </CardContent>
        </Card>
      )}

      {/* Grid rutinas + nutrición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Rutinas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Dumbbell size={14} className="text-blue-400" /> Rutinas
            </CardTitle>
            <Link href={`/dashboard/clients/${client.id}/routines/new`}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1">
                <Plus size={12} /> Nueva
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {!routines || routines.length === 0 ? (
              <div className="text-center py-6">
                <Dumbbell size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Sin rutinas aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {routines.map((routine) => (
                  <Link key={routine.id} href={`/dashboard/clients/${client.id}/routines/${routine.id}`}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition group ${routine.is_active ? 'bg-blue-500/5 border border-blue-500/20' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${routine.is_active ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
                        <Dumbbell size={12} className={routine.is_active ? 'text-blue-400' : 'text-zinc-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-white text-xs font-medium transition group-hover:text-orange-400">
                          {((routine.content as RoutineSummary | null)?.title) ?? routine.title}
                        </p>
                        <p className="text-zinc-600 text-xs">
                          {new Date(routine.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {routine.is_active && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1.5 shrink-0">Activa</Badge>
                      )}
                      <ChevronRight size={13} className="text-zinc-700 group-hover:text-orange-400 transition shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrición */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Salad size={14} className="text-green-400" /> Planes nutricionales
            </CardTitle>
            <Link href={`/dashboard/clients/${client.id}/nutrition/new`}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs gap-1">
                <Plus size={12} /> Nuevo
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {!nutritionPlans || nutritionPlans.length === 0 ? (
              <div className="text-center py-6">
                <Salad size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Sin planes aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {nutritionPlans.map((plan) => {
                  const kcal = (plan.content as NutritionSummary | null)?.calories_target
                  return (
                    <Link key={plan.id} href={`/dashboard/clients/${client.id}/nutrition/${plan.id}`}>
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition group ${plan.is_active ? 'bg-green-500/5 border border-green-500/20' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${plan.is_active ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                          <Salad size={12} className={plan.is_active ? 'text-green-400' : 'text-zinc-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="break-words text-white text-xs font-medium transition group-hover:text-orange-400">
                            {kcal ? `${kcal} kcal/día` : 'Plan nutricional'}
                          </p>
                          <p className="text-zinc-600 text-xs">
                            {new Date(plan.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {plan.is_active && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 shrink-0">Activo</Badge>
                        )}
                        <ChevronRight size={13} className="text-zinc-700 group-hover:text-orange-400 transition shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progreso de cargas */}
      <div className="mb-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <BarChart2 size={16} className="text-blue-400" /> Progreso de cargas
        </h3>
        <ClientExerciseProgress clientId={client.id} />
      </div>

      <div className="mb-4">
        <CheckinPhotoGallery items={checkinPhotos} />
      </div>

      {/* Check-ins */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Check-ins</h3>
            <p className="text-xs text-zinc-500">Seguimiento diario y semanal del cliente.</p>
          </div>
          <Link href={`/dashboard/clients/${client.id}/checkins/new`}>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs gap-1">
              <Plus size={12} /> Nuevo
            </Button>
          </Link>
        </div>
        <CheckinHistory checkins={checkins ?? []} />
      </div>
    </div>
  )
}
