import { generateContent } from '@/lib/gemini'
import { consumeAiGeneration } from '@/lib/billing'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await request.json()

  // Obtener cliente y perfil del entrenador en paralelo
  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('profiles').select('ai_system_prompt, ai_trainer_name').eq('id', user.id).single(),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const usageResult = await consumeAiGeneration(supabase, user.id)
  if (!usageResult.ok) {
    return NextResponse.json({
      error: usageResult.message,
      upgradeRequired: true,
      status: usageResult.status,
    }, { status: 402 })
  }

  const prompt = `
Genera una rutina de entrenamiento semanal personalizada para este cliente.

Datos del cliente:
- Nombre: ${client.full_name}
- Edad: ${client.age} años
- Peso: ${client.weight} kg
- Altura: ${client.height} cm
- Objetivo: ${client.goal}
- Nivel: ${client.level}
- Restricciones: ${client.restrictions || 'ninguna'}

IMPORTANTE: Responde SOLO con el JSON. Sin texto antes ni después. Sin comentarios. Sin comillas simples, usa solo comillas dobles.
Genera exactamente 4 días de entrenamiento, no más, con esta estructura:
{
  "title": "Rutina semanal - [nombre]",
  "days": [
    {
      "day": "Lunes",
      "focus": "Pecho y tríceps",
      "exercises": [
        {
          "name": "Press de banca",
          "sets": 4,
          "reps": "8-12",
          "rest": "90s",
          "notes": "Mantén los codos a 45 grados"
        }
      ]
    }
  ],
  "notes": "Recomendaciones generales para este cliente"
}
`

  try {
    const text = await generateContent(prompt, profile?.ai_system_prompt || undefined)
    console.log('Texto crudo de Gemini:', text)
    // Limpiar la respuesta de Gemini
    let clean = text!
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/\/\/.*$/gm, '') // eliminar comentarios
    .trim()

    // Extraer solo el JSON si hay texto extra
    
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')
    clean = jsonMatch[0]
    console.log('Respuesta de Gemini:', clean)
    const routine = JSON.parse(clean)

    const { data: saved } = await supabase
      .from('routines')
      .insert({
        client_id: clientId,
        trainer_id: user.id,
        title: routine.title,
        content: routine,
        week_start: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    return NextResponse.json({ routine: saved, status: usageResult.status })
  } catch (error) {
    console.error('Error completo:', error)
    return NextResponse.json({ error: 'Error generando rutina' }, { status: 500 })
  }
}
