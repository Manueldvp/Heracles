import 'server-only'

import { extractAssistantConfig } from '@/lib/ai-assistant'
import { createClient } from '@/lib/supabase/server'

function hasConfiguredAI(trainer: {
  assistant_name?: string | null
  assistant_personality?: string | null
  assistant_methodology?: string | null
  ai_trainer_name?: string | null
  ai_system_prompt?: string | null
} | null) {
  if (!trainer) return false

  const config = extractAssistantConfig(trainer)

  return Boolean(
    config.assistantName.trim() &&
    config.personality.trim()
  )
}

export async function validateConnection(userId: string) {
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, user_id, trainer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!client || !client.trainer_id || client.user_id !== userId) {
    console.log('validateConnection: invalid client link', {
      userId,
      hasClient: Boolean(client),
      trainerId: client?.trainer_id ?? null,
      matchesUser: client?.user_id === userId,
    })
    return false
  }

  const { data: trainer } = await supabase
    .from('profiles')
    .select('id, assistant_name, assistant_personality, assistant_methodology, ai_trainer_name, ai_system_prompt')
    .eq('id', client.trainer_id)
    .maybeSingle()

  if (!trainer) {
    console.log('validateConnection: trainer profile missing, allowing fallback config', {
      userId,
      trainerId: client.trainer_id,
    })
    return true
  }

  if (trainer.id !== client.trainer_id) {
    console.log('validateConnection: trainer id mismatch', {
      userId,
      trainerId: client.trainer_id,
      profileId: trainer.id,
    })
    return false
  }

  const valid = hasConfiguredAI(trainer)

  console.log('validateConnection: result', {
    userId,
    trainerId: client.trainer_id,
    valid,
    hasTrainerName: Boolean(trainer.assistant_name?.trim() || trainer.ai_trainer_name?.trim()),
    hasPersonality: Boolean(trainer.assistant_personality?.trim()),
    hasMethodology: Boolean(trainer.assistant_methodology?.trim()),
    hasSystemPrompt: Boolean(trainer.ai_system_prompt?.trim()),
  })

  return valid
}
