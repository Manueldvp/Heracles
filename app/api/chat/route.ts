import { generateContent } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()

  // Obtener contexto completo del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Obtener rutina, plan y últimos check-ins en paralelo
  const [{ data: routine }, { data: plan }, { data: checkins }, { data: profile }] = await Promise.all([
    supabase.from('routines').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('nutrition_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('checkins').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('profiles').select('ai_system_prompt, ai_trainer_name, full_name').eq('id', client.trainer_id).single(),
  ])

  const context = `
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

Responde de forma corta, cercana y motivadora. Máximo 3-4 oraciones.
Nunca menciones que eres una IA ni que vienes de Google.
`

  try {
    const response = await generateContent(message, context)
    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error chat:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
