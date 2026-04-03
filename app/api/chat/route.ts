import { generateContent } from '@/lib/gemini'
import {
  buildClientAiContext,
  buildClientSystemPrompt,
  buildTodayRoutineReply,
} from '@/lib/chat-context'
import { createClient } from '@/lib/supabase/server'
import { validateConnection } from '@/lib/ai/validateConnection'
import { NextResponse } from 'next/server'

function isTodayRoutineQuestion(message: string) {
  return /(que|qué)\s+me\s+toca\s+hoy|que\s+tengo\s+hoy|qué\s+tengo\s+hoy|entreno\s+de\s+hoy|rutina\s+de\s+hoy/i.test(message)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()
  const hasValidConnection = await validateConnection(user.id)
  if (!hasValidConnection) {
    return NextResponse.json({ error: 'AI connection unavailable' }, { status: 403 })
  }

  const context = await buildClientAiContext(supabase, user.id)
  if (!context) {
    return NextResponse.json({ error: 'Client context unavailable' }, { status: 404 })
  }

  console.log('[chat-context]', {
    day: context.day,
    routineFound: context.routine_today?.name ?? (context.hasAssignedRoutine ? 'rest-day' : 'missing-routine'),
    exercises: context.routine_today?.exercises.map((exercise) => exercise.name) ?? [],
  })

  if (isTodayRoutineQuestion(message)) {
    return NextResponse.json({ message: buildTodayRoutineReply(context) })
  }

  try {
    const response = await generateContent(message, buildClientSystemPrompt(context))
    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error chat:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
