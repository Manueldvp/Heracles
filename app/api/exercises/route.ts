import { NextRequest, NextResponse } from 'next/server'

type ExerciseApiItem = {
  exerciseId?: string
  id?: string
  name?: string
  imageUrl?: string
  gifUrl?: string
  image_url?: string
  videoUrl?: string
  video_url?: string
  video?: string
  source?: string
}

function mapExercise(item: ExerciseApiItem) {
  return {
    exerciseId: item.exerciseId ?? item.id ?? item.name,
    name: item.name ?? 'Exercise',
    imageUrl: item.imageUrl ?? item.gifUrl ?? item.image_url ?? '',
    videoUrl: item.videoUrl ?? item.video_url ?? item.video ?? '',
    mediaType: item.videoUrl || item.video_url || item.video ? 'video' : 'image',
    source: item.source ?? 'rapidapi',
  }
}

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
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  return NextResponse.json({ data: items.map(mapExercise) })
}
