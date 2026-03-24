import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Food = {
  name: string
  amount?: string
  notes?: string
  calories?: number
  protein_g?: number
  protein?: number
  carbs_g?: number
  carbs?: number
  fat_g?: number
  fat?: number
}

type Meal = {
  name: string
  time?: string
  calories?: number
  foods?: Food[]
}

type NutritionContent = {
  title?: string
  calories_target?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  macros?: {
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  }
  meals?: Meal[]
  supplements?: string[]
  notes?: string
}

export default async function ClientNutritionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/client')

  const { data: plan } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('id', id)
    .eq('client_id', client.id)
    .single()

  if (!plan) notFound()

  const content = plan.content as NutritionContent

  // Compatibilidad entre plan IA y manual
  const proteinG = content.macros?.protein_g ?? content.protein_g ?? 0
  const carbsG = content.macros?.carbs_g ?? content.carbs_g ?? 0
  const fatG = content.macros?.fat_g ?? content.fat_g ?? 0
  const macroTotal = Math.max(proteinG + carbsG + fatG, 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{content.title ?? 'Plan nutricional'}</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date(plan.created_at).toLocaleDateString('es-CL', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <Link href="/client">
          <Button variant="outline" className="border-zinc-700 text-zinc-400">
            ← Volver
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 mb-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Resumen diario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.18em]">Calorías objetivo</p>
              <p className="mt-2 text-4xl font-semibold text-white">{content.calories_target ?? 0}</p>
              <p className="text-sm text-zinc-500">kcal por día</p>
            </div>
            {[
              { label: 'Proteína', value: proteinG, color: 'bg-blue-400' },
              { label: 'Carbohidratos', value: carbsG, color: 'bg-amber-400' },
              { label: 'Grasas', value: fatG, color: 'bg-emerald-400' },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{item.label}</span>
                  <span className="font-medium text-white">{item.value}g</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${Math.max(10, (item.value / macroTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Estructura del día</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.18em]">Comidas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{content.meals?.length ?? 0}</p>
              <p className="text-sm text-zinc-500">bloques diarios</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.18em]">Suplementos</p>
              <p className="mt-2 text-3xl font-semibold text-white">{content.supplements?.length ?? 0}</p>
              <p className="text-sm text-zinc-500">indicaciones</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.18em]">Enfoque</p>
              <p className="mt-2 text-xl font-semibold text-white">Legible</p>
              <p className="text-sm text-zinc-500">por comida y macro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comidas */}
      <div className="grid gap-4 mb-6">
        {content.meals?.map((meal, index: number) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {meal.time && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {meal.time}
                    </Badge>
                  )}
                  <CardTitle className="text-white text-base">{meal.name}</CardTitle>
                </div>
                {meal.calories && (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    {meal.calories} kcal
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {meal.foods?.map((food, i: number) => (
                  <div key={i} className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex flex-col gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{food.name}</p>
                      {food.amount && <p className="text-zinc-500 text-xs mt-1">{food.amount}</p>}
                      {food.notes && (
                        <p className="text-zinc-400 text-xs mt-2 leading-5">{food.notes}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500 text-[11px] uppercase tracking-[0.16em]">Calorías</p>
                        <p className="text-sm font-semibold text-white">{food.calories ?? 0} kcal</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500 text-[11px] uppercase tracking-[0.16em]">Proteína</p>
                        <p className="text-sm font-semibold text-white">{food.protein_g ?? food.protein ?? 0} g</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500 text-[11px] uppercase tracking-[0.16em]">Carbos</p>
                        <p className="text-sm font-semibold text-white">{food.carbs_g ?? food.carbs ?? 0} g</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <p className="text-zinc-500 text-[11px] uppercase tracking-[0.16em]">Grasas</p>
                        <p className="text-sm font-semibold text-white">{food.fat_g ?? food.fat ?? 0} g</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suplementos */}
      {content.supplements?.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base">Suplementación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.supplements.map((sup: string, i: number) => (
                <Badge key={i} className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  {sup}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.notes && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm leading-relaxed">{content.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
