import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import type { AiClient } from './aiClient'
import { conCacheLlm, crearClaveCache } from './cache'
import type { LlmResult, PlanoEntrada } from '../types'
import { validarPlano } from '../skills/validarPlano'
import { mockValidacion } from '../skills/mock'

const planoBase: PlanoEntrada = {
  nombre: 'plano.pdf',
  ruta: 'plano.pdf',
  extension: '.pdf',
  mimeType: 'application/pdf',
  base64: 'cGxhbm8tYQ==',
  esFuentePrincipal: true,
  metadata: {},
}

const temporales: string[] = []
const cacheOriginal = process.env.RFQ_LLM_CACHE
const sufijoOriginal = process.env.RFQ_LLM_CACHE_SUFIJO

afterEach(async () => {
  if (cacheOriginal === undefined) delete process.env.RFQ_LLM_CACHE
  else process.env.RFQ_LLM_CACHE = cacheOriginal
  if (sufijoOriginal === undefined) delete process.env.RFQ_LLM_CACHE_SUFIJO
  else process.env.RFQ_LLM_CACHE_SUFIJO = sufijoOriginal
  await Promise.all(temporales.splice(0).map((directorio) => rm(directorio, { recursive: true, force: true })))
})

describe('cache LLM', () => {
  it('la misma entrada con el mismo prompt da la misma clave', () => {
    const entrada = { provider: 'gemini' as const, model: 'gemini-test', prompt: 'extrae', planos: [planoBase], sufijo: '1' }

    expect(crearClaveCache(entrada)).toBe(crearClaveCache(entrada))
  })

  it('un prompt distinto da clave distinta', () => {
    const comun = { provider: 'gemini' as const, model: 'gemini-test', planos: [planoBase], sufijo: '1' }

    expect(crearClaveCache({ ...comun, prompt: 'extrae' })).not.toBe(
      crearClaveCache({ ...comun, prompt: 'valida' })
    )
  })

  it('un plano distinto da clave distinta', () => {
    const comun = { provider: 'gemini' as const, model: 'gemini-test', prompt: 'extrae', sufijo: '1' }

    expect(crearClaveCache({ ...comun, planos: [planoBase] })).not.toBe(
      crearClaveCache({ ...comun, planos: [{ ...planoBase, base64: 'cGxhbm8tYg==' }] })
    )
  })

  it('un sufijo de repeticion distinto da clave distinta', () => {
    const comun = { provider: 'gemini' as const, model: 'gemini-test', prompt: 'extrae', planos: [planoBase] }

    expect(crearClaveCache({ ...comun, sufijo: '1' })).not.toBe(
      crearClaveCache({ ...comun, sufijo: '2' })
    )
  })

  it('no cachea si RFQ_LLM_CACHE no vale 1', async () => {
    const directorio = await crearTemporal()
    const cliente = new ClienteContador()
    const cacheado = conCacheLlm(cliente, { model: 'mock-test', cacheDir: directorio })
    process.env.RFQ_LLM_CACHE = '0'

    const primero = await cacheado.textJson('prompt')
    const segundo = await cacheado.textJson('prompt')

    expect(primero.data).toBe('respuesta-1')
    expect(segundo.data).toBe('respuesta-2')
    expect(await readdir(directorio)).toEqual([])
  })

  it('sirve una entrada valida y marca el uso como cacheado', async () => {
    const directorio = await crearTemporal()
    const cliente = new ClienteContador()
    const cacheado = conCacheLlm(cliente, { model: 'mock-test', cacheDir: directorio })
    process.env.RFQ_LLM_CACHE = '1'
    process.env.RFQ_LLM_CACHE_SUFIJO = '7'

    const primero = await cacheado.visionJson('prompt', [planoBase])
    const segundo = await cacheado.visionJson('prompt', [planoBase])

    expect(primero.data).toBe('respuesta-1')
    expect(segundo.data).toBe('respuesta-1')
    expect(segundo.usage).toMatchObject({ durationMs: 0, desdeCache: true })
    expect(await readdir(directorio)).toHaveLength(1)
  })

  it('ignora una entrada corrupta y la reemplaza con una respuesta fresca', async () => {
    const directorio = await crearTemporal()
    const cliente = new ClienteContador()
    const cacheado = conCacheLlm(cliente, { model: 'mock-test', cacheDir: directorio })
    process.env.RFQ_LLM_CACHE = '1'
    const clave = crearClaveCache({ provider: 'mock', model: 'mock-test', prompt: 'prompt', sufijo: '0' })
    await writeFile(join(directorio, `${clave}.json`), '{corrupto', 'utf8')

    const resultado = await cacheado.textJson('prompt')

    expect(resultado.data).toBe('respuesta-1')
    expect(JSON.parse(await readFile(join(directorio, `${clave}.json`), 'utf8'))).toMatchObject({ data: 'respuesta-1' })
  })

  it('el pipeline mock cruza la frontera cacheable del cliente LLM', async () => {
    const directorio = await crearTemporal()
    const cacheado = conCacheLlm(new ClienteValidacionMock(), { model: 'mock-test', cacheDir: directorio })
    process.env.RFQ_LLM_CACHE = '1'

    await validarPlano(cacheado, 'Cliente solicita una pieza', [planoBase])
    const segundo = await validarPlano(cacheado, 'Cliente solicita una pieza', [planoBase])

    expect(segundo.usage).toMatchObject({ durationMs: 0, desdeCache: true })
  })
})

async function crearTemporal(): Promise<string> {
  const directorio = await mkdtemp(join(tmpdir(), 'rfq-llm-cache-'))
  temporales.push(directorio)
  return directorio
}

class ClienteContador implements AiClient {
  readonly provider = 'mock' as const
  private llamadas = 0

  async visionJson(): Promise<LlmResult<string>> {
    return this.responder()
  }

  async textJson(): Promise<LlmResult<string>> {
    return this.responder()
  }

  private responder(): LlmResult<string> {
    this.llamadas += 1
    const data = `respuesta-${this.llamadas}`
    return {
      data,
      raw: data,
      usage: {
        provider: 'mock',
        inputTokens: 1,
        outputTokens: 1,
        estimatedCostEur: 0,
        durationMs: 10,
      },
    }
  }
}

class ClienteValidacionMock implements AiClient {
  readonly provider = 'mock' as const

  async visionJson(_prompt: string, planos: PlanoEntrada[]): Promise<LlmResult<string>> {
    const data = JSON.stringify(mockValidacion(planos))
    return {
      data,
      raw: data,
      usage: {
        provider: 'mock',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostEur: 0,
        durationMs: 25,
      },
    }
  }

  async textJson(prompt: string): Promise<LlmResult<string>> {
    return this.visionJson(prompt, [planoBase])
  }
}
