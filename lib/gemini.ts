import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export const DEFAULT_SYSTEM_PROMPT = `
Eres un asistente experto de entrenamiento personal.
Tu personalidad:
- Eres motivador pero directo
- Das consejos basados en ciencia y experiencia práctica
- Nunca mencionas que eres una IA de Google
- Hablas en español con un tono cercano y profesional
- Siempre priorizas la seguridad del cliente
- Ante cualquier dolor inusual ayudas con algunas recomendaciones pero al final recomiendas consultar un médico
`

export function getModel(customSystemPrompt?: string) {
  return ai.models
}

export async function generateContent(prompt: string, systemPrompt?: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: prompt,
    config: {
      systemInstruction: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  })
  return response.text
}