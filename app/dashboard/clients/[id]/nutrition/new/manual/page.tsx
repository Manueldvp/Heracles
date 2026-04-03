'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, Search } from 'lucide-react'

interface Food {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Meal {
  name: string
  foods: Food[]
}

interface FoodResult {
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

const DEFAULT_MEALS = ['Desayuno', 'Almuerzo', 'Cena', 'Snack']

export default function ManualNutritionPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')

  const [meals, setMeals] = useState<Meal[]>([
    { name: 'Desayuno', foods: [] },
    { name: 'Almuerzo', foods: [] },
    { name: 'Cena', foods: [] },
  ])

  const [activeMealIndex, setActiveMealIndex] = useState<number | null>(null)
  const [foodForm, setFoodForm] = useState<Food>({
    name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0
  })

  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<FoodResult[]>([])
  const [searchingFood, setSearchingFood] = useState(false)

  const searchFoods = async () => {
    if (!foodSearch.trim()) return
    setSearchingFood(true)
    try {
      const res = await fetch(`/api/foods?q=${encodeURIComponent(foodSearch)}`)
      const data = await res.json()
      setFoodResults(data)
    } catch {
      setFoodResults([])
    }
    setSearchingFood(false)
  }

  const selectFood = (food: FoodResult) => {
    setFoodForm({
      name: food.name,
      amount: '100g',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    })
    setFoodResults([])
    setFoodSearch('')
  }

  const addMeal = () => {
    const next = DEFAULT_MEALS[meals.length] ?? `Comida ${meals.length + 1}`
    setMeals([...meals, { name: next, foods: [] }])
  }

  const removeMeal = (i: number) => {
    setMeals(meals.filter((_, idx) => idx !== i))
    if (activeMealIndex === i) setActiveMealIndex(null)
  }

  const addFood = () => {
    if (!foodForm.name.trim() || activeMealIndex === null) return
    const updated = [...meals]
    updated[activeMealIndex].foods.push({ ...foodForm })
    setMeals(updated)
    setFoodForm({ name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const removeFood = (mealIdx: number, foodIdx: number) => {
    const updated = [...meals]
    updated[mealIdx].foods.splice(foodIdx, 1)
    setMeals(updated)
  }

  const totalFromFoods = meals.flatMap(m => m.foods).reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein: acc.protein + (f.protein || 0),
      carbs: acc.carbs + (f.carbs || 0),
      fat: acc.fat + (f.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const handleSave = async () => {
    if (!calories) { setError('Ingresa el objetivo de calorías'); return }
    if (meals.every(m => m.foods.length === 0)) { setError('Agrega al menos un alimento'); return }

    setSaving(true)
    setError('')

    const content = {
      calories_target: parseInt(calories),
      protein_g: parseInt(protein) || 0,
      carbs_g: parseInt(carbs) || 0,
      fat_g: parseInt(fat) || 0,
      notes,
      meals: meals.map(m => ({
        name: m.name,
        foods: m.foods,
      }))
    }

    const { data: { user } } = await supabase.auth.getUser()
    const response = await fetch('/api/nutrition/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, content }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error ?? 'No fue posible guardar el plan')
      setSaving(false)
      return
    }

    const plan = payload.plan as { id: string }

    // Notificar al cliente
    await fetch('/api/notify-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId,
        clientName: '',
        trainerId: user!.id,
        type: 'nutrition_assigned',
        message: 'Tu entrenador te asignó un nuevo plan nutricional',
      })
    })

    router.push(`/dashboard/clients/${clientId}/nutrition/${plan.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6">Crear plan nutricional manualmente</h2>

      {/* Macros objetivo */}
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardHeader className="pb-2">
          <p className="text-white font-semibold">Objetivos nutricionales</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs">Calorías</Label>
              <Input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                placeholder="2000"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Proteína (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                placeholder="150"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Carbos (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={e => setCarbs(e.target.value)}
                placeholder="200"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Grasas (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={e => setFat(e.target.value)}
                placeholder="60"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
          </div>

          {/* Totales calculados */}
          {totalFromFoods.calories > 0 && (
            <div className="bg-zinc-800 rounded-lg p-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-zinc-500 text-xs">Total kcal</p>
                <p className="text-white font-bold">{totalFromFoods.calories}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Proteína</p>
                <p className="text-blue-400 font-bold">{totalFromFoods.protein}g</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Carbos</p>
                <p className="text-yellow-400 font-bold">{totalFromFoods.carbs}g</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Grasas</p>
                <p className="text-orange-400 font-bold">{totalFromFoods.fat}g</p>
              </div>
            </div>
          )}

          <div>
            <Label className="text-zinc-400 text-xs">Notas / recomendaciones</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Evitar azúcares procesados, hidratarse bien..."
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comidas */}
      {meals.map((meal, mealIdx) => (
        <Card key={mealIdx} className="bg-zinc-900 border-zinc-800 mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Input
              value={meal.name}
              onChange={e => {
                const updated = [...meals]
                updated[mealIdx].name = e.target.value
                setMeals(updated)
              }}
              className="bg-transparent border-none text-white font-semibold text-base p-0 h-auto focus-visible:ring-0 w-40"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-400 text-xs"
                onClick={() => {
                  setActiveMealIndex(activeMealIndex === mealIdx ? null : mealIdx)
                  setFoodResults([])
                  setFoodSearch('')
                  setFoodForm({ name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
                }}
              >
                <Plus size={13} className="mr-1" />
                Agregar alimento
              </Button>
              {meals.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeMeal(mealIdx)}
                  className="border-red-800 text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>

            {/* Alimentos */}
            {meal.foods.length === 0 ? (
              <p className="text-zinc-600 text-sm">Sin alimentos aún.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {meal.foods.map((food, foodIdx) => (
                  <div key={foodIdx} className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{food.name}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {food.amount && <span className="text-zinc-500 text-xs">{food.amount}</span>}
                        <span className="text-zinc-400 text-xs">{food.calories} kcal</span>
                        <span className="text-blue-400 text-xs">P: {food.protein}g</span>
                        <span className="text-yellow-400 text-xs">C: {food.carbs}g</span>
                        <span className="text-orange-400 text-xs">G: {food.fat}g</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFood(mealIdx, foodIdx)}
                      className="text-red-400 hover:bg-red-400/10 shrink-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Form agregar alimento */}
            {activeMealIndex === mealIdx && (
              <div className="border border-zinc-700 rounded-xl p-4 flex flex-col gap-3">

                {/* Buscador */}
                <div>
                  <Label className="text-zinc-400 text-xs mb-1 block">Buscar alimento</Label>
                  <div className="flex gap-2">
                    <Input
                      value={foodSearch}
                      onChange={e => setFoodSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchFoods()}
                      placeholder="Ej: pollo, arroz, huevo..."
                      className="bg-zinc-800 border-zinc-700 text-white flex-1"
                    />
                    <Button
                      onClick={searchFoods}
                      disabled={searchingFood}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white shrink-0"
                    >
                      {searchingFood ? '...' : <Search size={16} />}
                    </Button>
                  </div>

                  {/* Resultados */}
                  {foodResults.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {foodResults.map((food, i) => (
                        <div
                          key={i}
                          onClick={() => selectFood(food)}
                          className="bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 cursor-pointer transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{food.name}</p>
                            <p className="text-zinc-500 text-xs">{food.serving}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <span className="text-zinc-400 text-xs">{food.calories}kcal</span>
                            <span className="text-blue-400 text-xs">P:{food.protein}g</span>
                            <span className="text-yellow-400 text-xs">C:{food.carbs}g</span>
                            <span className="text-orange-400 text-xs">G:{food.fat}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {foodResults.length === 0 && foodSearch && !searchingFood && (
                    <p className="text-zinc-600 text-xs mt-2">Sin resultados — ingresa manualmente abajo</p>
                  )}
                </div>

                {/* Separador */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-zinc-700" />
                  <span className="text-zinc-600 text-xs">o ingresa manualmente</span>
                  <div className="flex-1 h-px bg-zinc-700" />
                </div>

                {/* Form manual */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-zinc-400 text-xs">Alimento</Label>
                    <Input
                      value={foodForm.name}
                      onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                      placeholder="Ej: Pechuga de pollo"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Cantidad</Label>
                    <Input
                      value={foodForm.amount}
                      onChange={e => setFoodForm({ ...foodForm, amount: e.target.value })}
                      placeholder="Ej: 150g"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-zinc-400 text-xs">Calorías</Label>
                    <Input
                      type="number"
                      value={foodForm.calories || ''}
                      onChange={e => setFoodForm({ ...foodForm, calories: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Proteína (g)</Label>
                    <Input
                      type="number"
                      value={foodForm.protein || ''}
                      onChange={e => setFoodForm({ ...foodForm, protein: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Carbos (g)</Label>
                    <Input
                      type="number"
                      value={foodForm.carbs || ''}
                      onChange={e => setFoodForm({ ...foodForm, carbs: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Grasas (g)</Label>
                    <Input
                      type="number"
                      value={foodForm.fat || ''}
                      onChange={e => setFoodForm({ ...foodForm, fat: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={addFood}
                  disabled={!foodForm.name.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar alimento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Agregar comida */}
      {meals.length < 6 && (
        <Button
          variant="outline"
          onClick={addMeal}
          className="border-dashed border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-400 w-full mb-6"
        >
          <Plus size={16} className="mr-2" />
          Agregar comida
        </Button>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.back()} className="border-zinc-700 text-zinc-400">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
          {saving ? 'Guardando...' : 'Guardar plan'}
        </Button>
      </div>
    </div>
  )
}
