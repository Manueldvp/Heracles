import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { extractAssistantConfig } from '@/lib/ai-assistant'

type SupabaseLike = Awaited<ReturnType<typeof createSupabaseClient>>

type RoutineExercise = {
  name?: string
  sets?: number
  reps?: string
  rest?: string
  notes?: string
  image_url?: string
  video_url?: string
  media_url?: string
  media_type?: string
}

type WorkoutDay = {
  day?: string
  focus?: string
  exercises?: RoutineExercise[]
}

type RoutineContent = {
  title?: string
  days?: WorkoutDay[]
}

type TrainerProfile = {
  full_name?: string | null
  assistant_name?: string | null
  assistant_personality?: string | null
  assistant_methodology?: string | null
  ai_trainer_name?: string | null
  ai_system_prompt?: string | null
}

export type ClientAiContext = {
  date: Date
  day: string
  client: {
    id: string
    name: string
    goal: string
  }
  routine_today: {
    name: string
    focus: string
    exercises: Array<{
      name: string
      sets: number | null
      reps: string
      rest: string
      notes: string
      image_url: string
      video_url: string
      media_url: string
      media_type: string
    }>
  } | null
  trainer: {
    assistant_name: string
    personality: string
    methodology: string
  }
  hasAssignedRoutine: boolean
}

function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function getCurrentDayInSpanish(date = new Date()) {
  return new Intl.DateTimeFormat('es-CL', { weekday: 'long' })
    .format(date)
    .toLowerCase()
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function buildRoutinePromptBlock(context: ClientAiContext) {
  if (!context.hasAssignedRoutine) {
    return 'No tengo una rutina asignada para hoy, pero podemos trabajar movilidad o descanso activo.'
  }

  if (!context.routine_today) {
    return 'Hoy tienes descanso'
  }

  const focusLine = context.routine_today.focus ? `\nEnfoque: ${context.routine_today.focus}` : ''
  const exercises = context.routine_today.exercises.length
    ? context.routine_today.exercises.map((exercise) => `- ${exercise.name}`).join('\n')
    : '- Sin ejercicios cargados'

  return `${context.routine_today.name}${focusLine}\nExercises:\n${exercises}`
}

export function buildClientSystemPrompt(context: ClientAiContext) {
  return `You are ${context.trainer.assistant_name}, a personal trainer assistant.

Today is ${context.day}.

Client name: ${context.client.name}
Goal: ${context.client.goal}

Today's workout:
${buildRoutinePromptBlock(context)}

Your personality:
${context.trainer.personality}

Your methodology:
${context.trainer.methodology}

Rules:
- NEVER invent exercises
- NEVER guess the day
- NEVER repeat the date unless asked
- If no workout today -> say it's a rest day
- Be concise and motivating
- Speak Spanish`
}

export function buildTodayRoutineReply(context: ClientAiContext) {
  if (!context.hasAssignedRoutine) {
    return 'No tengo una rutina asignada para hoy, pero podemos trabajar movilidad o descanso activo.'
  }

  if (!context.routine_today) {
    return 'Hoy tienes descanso'
  }

  const exercises = context.routine_today.exercises.map((exercise) => exercise.name)
  const parts = [
    `Hoy te toca ${context.routine_today.name}.`,
    exercises.length ? `Ejercicios: ${exercises.join(', ')}.` : '',
    'Vamos con todo.',
  ].filter(Boolean)

  return parts.join(' ')
}

export async function buildClientAiContext(supabase: SupabaseLike, userId: string): Promise<ClientAiContext | null> {
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, goal, trainer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!client) return null

  const [{ data: profile }, { data: routine }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, assistant_name, assistant_personality, assistant_methodology, ai_trainer_name, ai_system_prompt')
      .eq('id', client.trainer_id)
      .maybeSingle(),
    supabase
      .from('routines')
      .select('id, title, content, is_active, created_at')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const today = new Date()
  const day = getCurrentDayInSpanish(today)
  const routineContent = (routine?.content ?? null) as RoutineContent | null
  const days = Array.isArray(routineContent?.days) ? routineContent.days : []
  const matchedDay = days.find((item) => normalizeText(item.day) === normalizeText(day))
  const rawExercises = Array.isArray(matchedDay?.exercises) ? matchedDay.exercises : []
  const requestedNames = rawExercises
    .map((exercise) => safeString(exercise.name))
    .filter(Boolean)

  let exerciseRows: Array<{
    name?: string | null
    image_url?: string | null
    video_url?: string | null
    media_url?: string | null
    media_type?: string | null
  }> = []

  if (requestedNames.length > 0) {
    const exercisesQuery = supabase
      .from('exercises')
      .select('name, image_url, video_url, media_url, media_type')
    const { data } = await exercisesQuery.in('name', requestedNames)

    exerciseRows = Array.isArray(data) ? data : []
  }

  const exerciseMap = new Map(
    exerciseRows.map((exercise) => [normalizeText(exercise.name), exercise])
  )
  const assistantConfig = extractAssistantConfig(profile as TrainerProfile | null)

  const routineToday = matchedDay
    ? {
        name: safeString(routineContent?.title, safeString(routine?.title, 'Rutina de hoy')),
        focus: safeString(matchedDay.focus),
        exercises: rawExercises.map((exercise) => {
          const resolved = exerciseMap.get(normalizeText(exercise.name))

          return {
            name: safeString(resolved?.name, safeString(exercise.name, 'Ejercicio')),
            sets: typeof exercise.sets === 'number' ? exercise.sets : null,
            reps: safeString(exercise.reps),
            rest: safeString(exercise.rest),
            notes: safeString(exercise.notes),
            image_url: safeString(resolved?.image_url, safeString(exercise.image_url)),
            video_url: safeString(resolved?.video_url, safeString(exercise.video_url)),
            media_url: safeString(resolved?.media_url, safeString(exercise.media_url)),
            media_type: safeString(resolved?.media_type, safeString(exercise.media_type)),
          }
        }),
      }
    : null

  return {
    date: today,
    day,
    client: {
      id: client.id,
      name: safeString(client.full_name, 'Cliente'),
      goal: safeString(client.goal, 'Mejorar su condicion fisica'),
    },
    routine_today: routineToday,
    trainer: {
      assistant_name: assistantConfig.assistantName,
      personality: assistantConfig.personality,
      methodology: assistantConfig.methodology,
    },
    hasAssignedRoutine: Boolean(routine),
  }
}
