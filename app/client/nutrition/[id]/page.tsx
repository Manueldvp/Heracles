import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Apple, ArrowLeft, Clock3, Leaf, Salad, Sparkles } from 'lucide-react'
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
  const supplements = content.supplements ?? []

  // Compatibilidad entre plan IA y manual
  const proteinG = content.macros?.protein_g ?? content.protein_g ?? 0
  const carbsG = content.macros?.carbs_g ?? content.carbs_g ?? 0
  const fatG = content.macros?.fat_g ?? content.fat_g ?? 0
  const macroTotal = Math.max(proteinG + carbsG + fatG, 1)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Salad className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="break-words text-2xl font-bold text-foreground">{content.title ?? 'Plan nutricional'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
            {new Date(plan.created_at).toLocaleDateString('es-CL', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
              </p>
            </div>
          </div>
        </div>
        <Link href="/client">
          <Button variant="outline" className="border-border text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 mb-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Resumen diario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.18em]">Calorías objetivo</p>
              </div>
              <p className="mt-2 text-4xl font-semibold text-foreground">{content.calories_target ?? 0}</p>
              <p className="text-sm text-muted-foreground">kcal por día</p>
            </div>
            {[
              { label: 'Proteína', value: proteinG, color: 'bg-primary', icon: Apple },
              { label: 'Carbohidratos', value: carbsG, color: 'bg-amber-400', icon: Leaf },
              { label: 'Grasas', value: fatG, color: 'bg-emerald-400', icon: Salad },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </span>
                  <span className="font-medium text-foreground">{item.value}g</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${Math.max(10, (item.value / macroTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Estructura del día</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Salad className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.18em]">Comidas</p>
              </div>
              <p className="mt-2 text-3xl font-semibold text-foreground">{content.meals?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">bloques diarios</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.18em]">Suplementos</p>
              </div>
              <p className="mt-2 text-3xl font-semibold text-foreground">{content.supplements?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">indicaciones</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Clock3 className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.18em]">Enfoque</p>
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">Legible</p>
              <p className="text-sm text-muted-foreground">por comida y macro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comidas */}
      <div className="grid gap-4 mb-6">
        {content.meals?.map((meal, index: number) => (
          <Card key={index} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {meal.time && (
                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                      {meal.time}
                    </Badge>
                  )}
                  <CardTitle className="break-words text-base text-foreground">{meal.name}</CardTitle>
                </div>
                {meal.calories && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {meal.calories} kcal
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {meal.foods?.map((food, i: number) => (
                  <div key={i} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">{food.name}</p>
                      {food.amount && <p className="mt-1 break-words text-xs text-muted-foreground">{food.amount}</p>}
                      {food.notes && (
                        <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{food.notes}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Calorías</p>
                        <p className="text-sm font-semibold text-foreground">{food.calories ?? 0} kcal</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Proteína</p>
                        <p className="text-sm font-semibold text-foreground">{food.protein_g ?? food.protein ?? 0} g</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Carbos</p>
                        <p className="text-sm font-semibold text-foreground">{food.carbs_g ?? food.carbs ?? 0} g</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Grasas</p>
                        <p className="text-sm font-semibold text-foreground">{food.fat_g ?? food.fat ?? 0} g</p>
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
      {supplements.length > 0 && (
        <Card className="mb-4 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Suplementación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supplements.map((sup: string, i: number) => (
                <Badge key={i} className="border-border bg-muted/40 text-foreground">
                  {sup}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.notes && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
