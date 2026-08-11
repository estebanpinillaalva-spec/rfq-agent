import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import type { AiClient } from './aiClient'
import type { AiProviderName, LlmResult, PlanoEntrada } from '../types'

export const LLM_CACHE_HIT_MARKER = 'RFQ_LLM_CACHE_HIT'
export const LLM_CACHE_MISS_MARKER = 'RFQ_LLM_CACHE_MISS'

interface EntradaClaveCache {
  provider: AiProviderName
  model: string
  prompt: string
  planos?: PlanoEntrada[]
  sufijo?: string
}

interface OpcionesCacheLlm {
  model: string
  cacheDir?: string
}

const llmResultSchema = z.object({
  data: z.string(),
  raw: z.string(),
  usage: z.object({
    provider: z.enum(['mock', 'gemini']),
    inputTokens: z.number().finite(),
    outputTokens: z.number().finite(),
    estimatedCostEur: z.number().finite(),
    durationMs: z.number().finite(),
    desdeCache: z.boolean().optional(),
  }),
})

export function crearClaveCache(entrada: EntradaClaveCache): string {
  const hash = createHash('sha256')
  anadirParte(hash, entrada.provider)
  anadirParte(hash, entrada.model)
  anadirParte(hash, entrada.prompt)
  for (const plano of entrada.planos ?? []) {
    anadirParte(hash, plano.nombre)
    anadirParte(hash, plano.base64)
  }
  const sufijo = entrada.sufijo ?? process.env.RFQ_LLM_CACHE_SUFIJO ?? '0'
  return `${hash.digest('hex')}-${encodeURIComponent(sufijo)}`
}

export function conCacheLlm(cliente: AiClient, opciones: OpcionesCacheLlm): AiClient {
  const cacheDir = opciones.cacheDir ?? resolve('benchmark', 'cache')

  return {
    provider: cliente.provider,
    visionJson: (prompt, planos) => ejecutarConCache(cliente, opciones.model, cacheDir, prompt, planos),
    textJson: (prompt) => ejecutarConCache(cliente, opciones.model, cacheDir, prompt),
  }
}

async function ejecutarConCache(
  cliente: AiClient,
  model: string,
  cacheDir: string,
  prompt: string,
  planos?: PlanoEntrada[]
): Promise<LlmResult<string>> {
  const llamarCliente = (): Promise<LlmResult<string>> => planos === undefined
    ? cliente.textJson(prompt)
    : cliente.visionJson(prompt, planos)

  if (process.env.RFQ_LLM_CACHE !== '1') return llamarCliente()

  const clave = crearClaveCache({
    provider: cliente.provider,
    model,
    prompt,
    planos,
  })
  const ruta = join(cacheDir, `${clave}.json`)
  const cacheado = await leerCache(ruta)
  if (cacheado) {
    console.log(LLM_CACHE_HIT_MARKER)
    return {
      ...cacheado,
      usage: {
        ...cacheado.usage,
        durationMs: 0,
        desdeCache: true,
      },
    }
  }

  console.log(LLM_CACHE_MISS_MARKER)
  const resultado = await llamarCliente()
  await guardarCache(cacheDir, ruta, resultado)
  return resultado
}

async function leerCache(ruta: string): Promise<LlmResult<string> | null> {
  try {
    const contenido = JSON.parse(await readFile(ruta, 'utf8')) as unknown
    return llmResultSchema.parse(contenido) as LlmResult<string>
  } catch {
    return null
  }
}

async function guardarCache(cacheDir: string, ruta: string, resultado: LlmResult<string>): Promise<void> {
  try {
    await mkdir(cacheDir, { recursive: true })
    await writeFile(ruta, JSON.stringify(resultado, null, 2), 'utf8')
  } catch {
    // La cache es una optimizacion: nunca debe hacer fallar una llamada real.
  }
}

function anadirParte(hash: ReturnType<typeof createHash>, valor: string): void {
  hash.update(String(Buffer.byteLength(valor, 'utf8')))
  hash.update(':')
  hash.update(valor)
  hash.update('|')
}
