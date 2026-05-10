import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { RETRY_JSON_SUFFIX, parseJsonDefensivo } from './json'

const schema = z.object({ valor: z.number() })

describe('parseJsonDefensivo', () => {
  it('parsea JSON valido directamente', () => {
    expect(parseJsonDefensivo('{"valor": 42}', schema, 'test')).toEqual({ valor: 42 })
  })

  it('extrae JSON de un bloque markdown json', () => {
    const raw = '```json\n{"valor": 7}\n```'
    expect(parseJsonDefensivo(raw, schema, 'test')).toEqual({ valor: 7 })
  })

  it('extrae JSON de un bloque markdown sin tipo', () => {
    const raw = '```\n{"valor": 9}\n```'
    expect(parseJsonDefensivo(raw, schema, 'test')).toEqual({ valor: 9 })
  })

  it('extrae JSON precedido de texto libre', () => {
    const raw = 'Aqui tienes el resultado: {"valor": 3} fin.'
    expect(parseJsonDefensivo(raw, schema, 'test')).toEqual({ valor: 3 })
  })

  it('lanza error si el valor no pasa la validacion Zod', () => {
    expect(() => parseJsonDefensivo('{"valor": "texto"}', schema, 'test')).toThrow()
  })

  it('lanza error si no hay JSON reconocible', () => {
    expect(() => parseJsonDefensivo('sin json aqui', schema, 'test')).toThrow()
  })
})

describe('RETRY_JSON_SUFFIX', () => {
  it('contiene la instruccion de JSON puro sin markdown', () => {
    expect(RETRY_JSON_SUFFIX).toContain('UNICAMENTE con el objeto JSON')
  })

  it('empieza con salto de linea para separarse del prompt original', () => {
    expect(RETRY_JSON_SUFFIX.startsWith('\n')).toBe(true)
  })
})
