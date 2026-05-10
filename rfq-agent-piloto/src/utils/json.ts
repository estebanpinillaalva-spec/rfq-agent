import { z } from 'zod'

export function parseJsonDefensivo<T>(raw: string, schema: z.ZodType<T>, contexto: string): T {
  const cleaned = raw.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenceMatch?.[1] ?? extractJsonObject(cleaned)

  try {
    const parsed: unknown = JSON.parse(candidate)
    return schema.parse(parsed)
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error)
    throw new Error(`No se pudo parsear/validar el JSON de ${contexto}: ${detalle}`)
  }
}

// Appended to the original prompt when the first attempt produces malformed JSON.
export const RETRY_JSON_SUFFIX =
  '\n\nATENCION: Tu respuesta anterior no era JSON valido. Responde UNICAMENTE con el objeto JSON requerido. Sin texto antes ni despues, sin bloques markdown (``` ), sin comentarios, sin explicaciones. Solo el JSON puro empezando por { y terminando por }.'

function extractJsonObject(text: string): string {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')

  if (first === -1 || last === -1 || last <= first) {
    throw new Error('La respuesta no contiene un objeto JSON')
  }

  return text.slice(first, last + 1)
}
