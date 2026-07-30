import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Modelo por defecto para el proyecto
export const CLAUDE_MODEL = 'claude-sonnet-4-6'

// Helper para llamadas de texto simples
export async function claudeText(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Respuesta inesperada de Claude')
  return block.text
}
