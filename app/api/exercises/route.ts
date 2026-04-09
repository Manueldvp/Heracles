import { NextRequest, NextResponse } from 'next/server'
import { searchExercises } from '@/lib/exercises-api'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json({ data: [] })

  try {
    const exercises = await searchExercises(query)
    return NextResponse.json({ data: exercises })
  } catch (error) {
    console.error('Exercises API error:', error)
    return NextResponse.json(
      { data: [], error: 'No se pudieron cargar los ejercicios.' },
      { status: 502 },
    )
  }
}
