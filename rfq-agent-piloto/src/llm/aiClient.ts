import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiProviderName, LlmResult, LlmUsage, PlanoEntrada } from '../types'

export interface AiClient {
  readonly provider: AiProviderName
  visionJson(prompt: string, planos: PlanoEntrada[]): Promise<LlmResult<string>>
  textJson(prompt: string): Promise<LlmResult<string>>
}

export function createAiClient(): AiClient {
  const provider = parseProvider(process.env.RFQ_AI_PROVIDER)
  if (provider === 'gemini') return new GeminiClient()
  return new MockClient()
}

function parseProvider(value: string | undefined): AiProviderName {
  if (value === 'gemini') return 'gemini'
  if (value === undefined || value === '' || value === 'mock') return 'mock'
  throw new Error(`RFQ_AI_PROVIDER invalido: "${value}". Usa "mock" o "gemini".`)
}

class MockClient implements AiClient {
  readonly provider = 'mock' as const

  async visionJson(prompt: string): Promise<LlmResult<string>> {
    return makeMockResult(prompt)
  }

  async textJson(prompt: string): Promise<LlmResult<string>> {
    return makeMockResult(prompt)
  }
}

class GeminiClient implements AiClient {
  readonly provider = 'gemini' as const
  private readonly client: GoogleGenerativeAI
  private readonly modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-pro'

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        'Falta GOOGLE_GEMINI_API_KEY. Para demo gratis usa RFQ_AI_PROVIDER=mock en .env.local, o anade tu clave de Gemini.'
      )
    }
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async visionJson(prompt: string, planos: PlanoEntrada[]): Promise<LlmResult<string>> {
    const start = Date.now()
    const model = this.client.getGenerativeModel({ model: this.modelName })
    const fuentesPrincipales = planos.filter((plano) => plano.esFuentePrincipal)
    const contextoCad = planos
      .filter((plano) => !plano.esFuentePrincipal)
      .map((plano) => `Archivo CAD contexto: ${plano.nombre}\n${plano.textoExtraido ?? '[sin texto extraido]'}`)
      .join('\n\n')

    const result = await withRetry(() => withTimeout(model.generateContent([
      ...fuentesPrincipales.map((plano) => ({
        inlineData: { data: plano.base64, mimeType: plano.mimeType },
      })),
      { text: contextoCad ? `${prompt}\n\n---\nCONTEXTO CAD NO COTADO:\n${contextoCad}` : prompt },
    ]), 120000), 'Gemini vision')
    const text = result.response.text()
    return {
      data: text,
      raw: text,
      usage: usageFromGemini(start, result.response.usageMetadata),
    }
  }

  async textJson(prompt: string): Promise<LlmResult<string>> {
    const start = Date.now()
    const model = this.client.getGenerativeModel({ model: this.modelName })
    const result = await withRetry(() => withTimeout(model.generateContent(prompt), 120000), 'Gemini text')
    const text = result.response.text()
    return {
      data: text,
      raw: text,
      usage: usageFromGemini(start, result.response.usageMetadata),
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const attempts = 3
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
      }
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`${label} fallo tras ${attempts} intentos: ${detail}`)
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timeout tras ${Math.round(timeoutMs / 1000)}s`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

function makeMockResult(prompt: string): LlmResult<string> {
  return {
    data: prompt,
    raw: prompt,
    usage: {
      provider: 'mock',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostEur: 0,
      durationMs: 25,
    },
  }
}

function usageFromGemini(
  start: number,
  metadata: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined
): LlmUsage {
  const inputTokens = metadata?.promptTokenCount ?? 0
  const outputTokens = metadata?.candidatesTokenCount ?? Math.max((metadata?.totalTokenCount ?? 0) - inputTokens, 0)

  return {
    provider: 'gemini',
    inputTokens,
    outputTokens,
    estimatedCostEur: 0,
    durationMs: Date.now() - start,
  }
}
