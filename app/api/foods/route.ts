import { NextRequest, NextResponse } from 'next/server'

type FoodProduct = {
  product_name?: string
  serving_size?: string
  nutriments?: Record<string, number | undefined>
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json([])

  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&fields=product_name,nutriments,serving_size&search_simple=1&action=process`,
    { headers: { 'User-Agent': 'Treinex Fitness App - support@treinex.app' } }
  )

  if (!res.ok) return NextResponse.json([])

  const data = await res.json()

  const foods = ((data.products ?? []) as FoodProduct[])
    .filter((product) => product.product_name && product.nutriments)
    .map((product) => ({
      name: product.product_name,
      serving: product.serving_size ?? '100g',
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] ?? product.nutriments?.['energy-kcal'] ?? 0),
      protein: Math.round((product.nutriments?.['proteins_100g'] ?? 0) * 10) / 10,
      carbs: Math.round((product.nutriments?.['carbohydrates_100g'] ?? 0) * 10) / 10,
      fat: Math.round((product.nutriments?.['fat_100g'] ?? 0) * 10) / 10,
    }))
    .filter((food) => food.calories > 0)

  return NextResponse.json(foods)
}
