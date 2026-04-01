import { generateContent } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { validateConnection } from '@/lib/ai/validateConnection'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()
  const now = new Date()
  const realtimeContext = `
Fecha actual: ${now.toLocaleDateString('es-CL', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})}
Hora actual: ${now.toLocaleTimeString('es-CL')}

Usa siempre la fecha y hora actual proporcionadas. Nunca adivines.
`

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let context = ''

  if (client) {
    const hasValidConnection = await validateConnection(user.id)
    if (!hasValidConnection) {
      return NextResponse.json({ error: 'AI connection unavailable' }, { status: 403 })
    }

    const [{ data: routine }, { data: plan }, { data: checkins }, { data: profile }] = await Promise.all([
      supabase.from('routines').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('nutrition_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('checkins').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('profiles').select('ai_system_prompt, ai_trainer_name, full_name').eq('id', client.trainer_id).single(),
    ])

    context = `
${realtimeContext}

Eres el asistente personal de ${client.full_name}, creado por su entrenador ${profile?.full_name || 'su entrenador'}.
Tu nombre es ${profile?.ai_trainer_name || 'Treinex'}.

${profile?.ai_system_prompt || ''}

Información actual del cliente:
- Nombre: ${client.full_name}
- Objetivo: ${client.goal}
- Nivel: ${client.level}
- Peso: ${client.weight}kg
- Restricciones: ${client.restrictions || 'ninguna'}

${routine ? `Rutina actual: ${JSON.stringify(routine.content)}` : 'Sin rutina asignada aún.'}
${plan ? `Plan nutricional: ${JSON.stringify(plan.content)}` : 'Sin plan nutricional aún.'}
${checkins?.length ? `Últimos check-ins: ${JSON.stringify(checkins)}` : 'Sin check-ins aún.'}
`
  } else {
    const [{ data: profile }, { data: clients }] = await Promise.all([
      supabase.from('profiles').select('full_name, ai_system_prompt, ai_trainer_name').eq('id', user.id).single(),
      supabase.from('clients').select('id, full_name, goal, level').eq('trainer_id', user.id).order('created_at', { ascending: false }).limit(6),
    ])

    const clientIds = (clients ?? []).map((clientItem) => clientItem.id)
    const { data: trainerRoutines } = clientIds.length
      ? await supabase
          .from('routines')
          .select('id, title, client_id, created_at')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(6)
      : { data: [] }
    const safeTrainerRoutines = trainerRoutines ?? []

    context = `
${realtimeContext}

Eres el asistente operativo del entrenador ${profile?.full_name || 'Treinex'}.
Tu nombre es ${profile?.ai_trainer_name || 'Treinex'}.

${profile?.ai_system_prompt || ''}

Resumen actual del entrenador:
- Clientes recientes: ${clients?.length ? JSON.stringify(clients) : 'Sin clientes aún.'}
- Rutinas recientes: ${safeTrainerRoutines.length ? JSON.stringify(safeTrainerRoutines) : 'Sin rutinas recientes.'}

Ayuda al entrenador con respuestas cortas, prácticas y accionables para su operación diaria.
`
  }

  context += `

Responde de forma corta, cercana y motivadora. Máximo 3-4 oraciones.
Nunca menciones que eres una IA ni que vienes de Google.
Usa siempre la fecha y hora actual proporcionadas. Nunca adivines.
`

  try {
    const response = await generateContent(message, context)
    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error chat:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
