import { generateContent } from '@/lib/gemini'
import { consumeAiGeneration } from '@/lib/billing'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await request.json()

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('profiles').select('ai_system_prompt').eq('id', user.id).single(),
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

  // Calcular calorías base (fórmula Mifflin-St Jeor)
  const bmr = client.weight && client.height && client.age
    ? Math.round(10 * client.weight + 6.25 * client.height - 5 * client.age + 5)
    : null

  const prompt = `
Genera un plan nutricional semanal personalizado para este cliente.

Datos del cliente:
- Nombre: ${client.full_name}
- Edad: ${client.age} años
- Peso: ${client.weight} kg
- Altura: ${client.height} cm
- Objetivo: ${client.goal}
- Nivel de actividad: ${client.level}
- Restricciones/alergias: ${client.restrictions || 'ninguna'}
${bmr ? `- TMB estimada: ${bmr} kcal` : ''}

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con esta estructura exacta:
{
  "title": "Plan nutricional - [nombre]",
  "calories_target": 2500,
  "macros": {
    "protein_g": 180,
    "carbs_g": 280,
    "fat_g": 70
  },
  "meals_per_day": 4,
  "meals": [
    {
      "name": "Desayuno",
      "time": "08:00",
      "calories": 600,
      "foods": [
        {
          "name": "Avena con leche",
          "amount": "80g",
          "calories": 300,
          "protein_g": 10,
          "notes": "Puedes agregar frutas"
        }
      ]
    }
  ],
  "supplements": ["Proteína whey post-entreno", "Creatina 5g diaria"],
  "notes": "Recomendaciones generales de nutrición para este cliente"
}

IMPORTANTE: Responde SOLO con el JSON. Sin texto antes ni después. Sin comentarios. Sin comillas simples, usa solo comillas dobles. Genera exactamente 4-5 comidas.
`

  try {
    const text = await generateContent(prompt, profile?.ai_system_prompt || undefined)

    let clean = text!
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\/\/.*$/gm, '')
      .trim()

    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')
    clean = jsonMatch[0]

    const plan = JSON.parse(clean)

    const { data: saved } = await supabase
      .from('nutrition_plans')
      .insert({
        client_id: clientId,
        trainer_id: user.id,
        content: plan,
      })
      .select()
      .single()

    return NextResponse.json({ plan: saved, status: usageResult.status })
  } catch (error) {
    console.error('Error completo:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
