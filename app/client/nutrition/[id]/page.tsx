import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  const content = plan.content as any

  // Compatibilidad entre plan IA y manual
  const proteinG = content.macros?.protein_g ?? content.protein_g ?? 0
  const carbsG = content.macros?.carbs_g ?? content.carbs_g ?? 0
  const fatG = content.macros?.fat_g ?? content.fat_g ?? 0

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

      {/* Macros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-zinc-400 text-xs">Calorías</p>
            <p className="text-orange-500 font-bold text-2xl mt-1">{content.calories_target}</p>
            <p className="text-zinc-500 text-xs">kcal/día</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-zinc-400 text-xs">Proteína</p>
            <p className="text-blue-400 font-bold text-2xl mt-1">{proteinG}g</p>
            <p className="text-zinc-500 text-xs">por día</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-zinc-400 text-xs">Carbohidratos</p>
            <p className="text-yellow-400 font-bold text-2xl mt-1">{carbsG}g</p>
            <p className="text-zinc-500 text-xs">por día</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-zinc-400 text-xs">Grasas</p>
            <p className="text-green-400 font-bold text-2xl mt-1">{fatG}g</p>
            <p className="text-zinc-500 text-xs">por día</p>
          </CardContent>
        </Card>
      </div>

      {/* Comidas */}
      <div className="grid gap-4 mb-6">
        {content.meals?.map((meal: any, index: number) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {meal.time && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
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
              <div className="grid gap-2">
                {meal.foods?.map((food: any, i: number) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{food.name}</p>
                      {food.notes && (
                        <p className="text-zinc-400 text-xs mt-1">💡 {food.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end shrink-0">
                      {food.amount && (
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                          {food.amount}
                        </Badge>
                      )}
                      {food.calories > 0 && (
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300 text-xs">
                          {food.calories} kcal
                        </Badge>
                      )}
                      {(food.protein_g ?? food.protein) > 0 && (
                        <Badge variant="outline" className="border-blue-800 text-blue-400 text-xs">
                          {food.protein_g ?? food.protein}g prot
                        </Badge>
                      )}
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
            <CardTitle className="text-white text-base">💊 Suplementación</CardTitle>
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
            <CardTitle className="text-white text-base">📋 Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm leading-relaxed">{content.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}