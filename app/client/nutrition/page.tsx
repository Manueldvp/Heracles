import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Salad, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import SetActiveNutritionButton from './SetActiveNutritionButton'

export default async function ClientNutritionListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients').select('*').eq('user_id', user.id).single()
  if (!client) redirect('/client')

  const { data: plans } = await supabase
    .from('nutrition_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client" className="text-zinc-500 hover:text-zinc-300 transition">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Salad size={18} className="text-primary" />
            Mis planes nutricionales
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">{plans?.length ?? 0} planes asignados · toca uno para activarlo</p>
        </div>
      </div>

      {!plans || plans.length === 0 ? (
        <Card className="bg-zinc-900 border-dashed border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Salad size={36} className="text-zinc-600" />
            <p className="text-zinc-400 text-sm">Tu entrenador aún no ha asignado planes nutricionales.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan) => {
            const content = plan.content as any
            const isActive = plan.is_active
            const proteinG = content.macros?.protein_g ?? content.protein_g ?? 0
            const carbsG = content.macros?.carbs_g ?? content.carbs_g ?? 0
            const fatG = content.macros?.fat_g ?? content.fat_g ?? 0

            return (
              <Card key={plan.id}
                className={`bg-zinc-900 transition ${isActive ? 'border-primary/30 bg-primary/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/10' : 'bg-green-500/10'}`}>
                      <Salad size={16} className={isActive ? 'text-primary' : 'text-green-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm break-words">{content.title ?? 'Plan nutricional'}</p>
                        {isActive && (
                          <Badge className="text-xs shrink-0">Activo</Badge>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {content.calories_target} kcal · {content.meals?.length ?? 0} comidas · {new Date(plan.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <Link href={`/client/nutrition/${plan.id}`}>
                      <ChevronRight size={16} className="text-zinc-600 hover:text-zinc-400 transition" />
                    </Link>
                  </div>

                  {/* Macros */}
                  <div className="flex gap-2 mb-3">
                    {[
                      { label: 'Proteína', val: proteinG, color: 'text-red-400', bg: 'bg-red-500/10' },
                      { label: 'Carbos', val: carbsG, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                      { label: 'Grasas', val: fatG, color: 'text-primary', bg: 'bg-primary/10' },
                    ].map(({ label, val, color, bg }) => (
                      <div key={label} className={`${bg} rounded-xl px-3 py-1.5 text-center flex-1 min-w-0`}>
                        <p className={`${color} font-bold text-sm leading-none`}>{val}g</p>
                        <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {!isActive && (
                    <SetActiveNutritionButton planId={plan.id} clientId={client.id} />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
