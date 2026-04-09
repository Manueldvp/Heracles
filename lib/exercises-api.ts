type RawExercisesApiEnvelope<T> =
  | {
      data?: T
      meta?: unknown
    }
  | T

type ExercisesListPayload = {
  data?: ExercisesApiExercise[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export type ExercisesApiExercise = {
  id: string
  slug: string
  name: string
  description?: string | null
  instructions?: string | null
  media?: {
    video?: {
      url?: string | null
      optimizedUrl?: string | null
    } | null
    thumbnail?: {
      url?: string | null
    } | null
  } | null
  muscles?: {
    primary?: Array<{ name?: string | null }>
    secondary?: Array<{ name?: string | null }>
  } | null
  tags?: string[]
}

export type RoutineExerciseDraft = {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
  description?: string | null
  instructions?: string[] | string | null
  image_url?: string | null
  video_url?: string | null
  media_type?: string | null
  exercise_id?: string | null
}

const DEFAULT_EXERCISES_API_URL = 'http://127.0.0.1:3000/api/v1'

function getExercisesApiBaseUrl() {
  return (process.env.EXERCISES_API_URL ?? DEFAULT_EXERCISES_API_URL).replace(/\/$/, '')
}

function getExercisesApiHeaders() {
  const apiKey = process.env.EXERCISES_API_KEY

  if (!apiKey) {
    throw new Error('Missing EXERCISES_API_KEY environment variable')
  }

  return {
    'x-api-key': apiKey,
    Accept: 'application/json',
  }
}

function unwrapEnvelope<T>(payload: RawExercisesApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }

  return payload as T
}

function normalizeExerciseName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function mapExercisesApiExercise(exercise: ExercisesApiExercise) {
  const videoUrl = exercise.media?.video?.optimizedUrl ?? exercise.media?.video?.url ?? ''
  const imageUrl = exercise.media?.thumbnail?.url ?? ''

  return {
    exerciseId: exercise.id,
    slug: exercise.slug,
    name: exercise.name,
    description: exercise.description ?? null,
    instructions: exercise.instructions ?? null,
    imageUrl,
    videoUrl,
    mediaType: videoUrl ? 'video' : imageUrl ? 'image' : null,
    source: 'treinexercise-db',
    tags: exercise.tags ?? [],
    muscles: [
      ...(exercise.muscles?.primary ?? []),
      ...(exercise.muscles?.secondary ?? []),
    ]
      .map((item) => item.name?.trim())
      .filter((value): value is string => Boolean(value)),
  }
}

export async function searchExercises(query: string, limit = 12) {
  const search = query.trim()
  if (!search) return []

  const url = new URL(`${getExercisesApiBaseUrl()}/exercises`)
  url.searchParams.set('search', search)
  url.searchParams.set('lang', 'es')
  url.searchParams.set('limit', String(limit))

  const response = await fetch(url.toString(), {
    headers: getExercisesApiHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Exercises API search failed with status ${response.status}`)
  }

  const payload = (await response.json()) as RawExercisesApiEnvelope<ExercisesListPayload>
  const data = unwrapEnvelope(payload)
  return (data.data ?? []).map(mapExercisesApiExercise)
}

export async function resolveExerciseByName(name: string) {
  const results = await searchExercises(name, 8)
  if (results.length === 0) return null

  const normalizedTarget = normalizeExerciseName(name)

  return (
    results.find((exercise) => normalizeExerciseName(exercise.name) === normalizedTarget)
    ?? results.find((exercise) => normalizeExerciseName(exercise.name).includes(normalizedTarget))
    ?? results[0]
  )
}

export async function hydrateRoutineContentWithExercises<
  T extends {
    days?: Array<{
      day?: string
      focus?: string
      exercises?: RoutineExerciseDraft[]
    }>
  },
>(content: T): Promise<T> {
  const days = Array.isArray(content.days) ? content.days : []

  const uniqueNames = Array.from(
    new Set(
      days.flatMap((day) =>
        (day.exercises ?? [])
          .map((exercise) => exercise.name?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  )

  const resolvedEntries = await Promise.all(
    uniqueNames.map(async (name) => [name, await resolveExerciseByName(name)] as const),
  )

  const resolvedMap = new Map(resolvedEntries)

  return {
    ...content,
    days: days.map((day) => ({
      ...day,
      exercises: (day.exercises ?? []).map((exercise) => {
        const resolved = resolvedMap.get(exercise.name?.trim() ?? '') ?? null

        return {
          ...exercise,
          exercise_id: resolved?.exerciseId ?? exercise.exercise_id ?? null,
          description: resolved?.description ?? exercise.description ?? null,
          instructions: resolved?.instructions ?? exercise.instructions ?? null,
          image_url: resolved?.imageUrl || exercise.image_url || null,
          video_url: resolved?.videoUrl || exercise.video_url || null,
          media_type: resolved?.mediaType ?? exercise.media_type ?? null,
        }
      }),
    })),
  }
}
