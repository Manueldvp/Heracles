import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json([])

  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&fields=product_name,nutriments,serving_size&search_simple=1&action=process`,
    { headers: { 'User-Agent': 'Heracles Fitness App - contact@heracles.app' } }
  )

  if (!res.ok) return NextResponse.json([])

  const data = await res.json()

  const foods = (data.products ?? [])
    .filter((p: any) => p.product_name && p.nutriments)
    .map((p: any) => ({
      name: p.product_name,
      serving: p.serving_size ?? '100g',
      calories: Math.round(p.nutriments['energy-kcal_100g'] ?? p.nutriments['energy-kcal'] ?? 0),
      protein: Math.round((p.nutriments['proteins_100g'] ?? 0) * 10) / 10,
      carbs: Math.round((p.nutriments['carbohydrates_100g'] ?? 0) * 10) / 10,
      fat: Math.round((p.nutriments['fat_100g'] ?? 0) * 10) / 10,
    }))
    .filter((f: any) => f.calories > 0)

  return NextResponse.json(foods)
}