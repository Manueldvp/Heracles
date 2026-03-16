import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json([])

  const res = await fetch(
    `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodeURIComponent(query)}`,
    {
      headers: {
        'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      },
    }
  )

  if (!res.ok) {
    console.error('ExerciseDB error:', res.status, await res.text())
    return NextResponse.json([], { status: res.status })
  }

  const data = await res.json()
  console.log('ExerciseDB response:', JSON.stringify(data).substring(0, 200))
  return NextResponse.json(data)
}