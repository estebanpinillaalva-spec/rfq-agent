import { describe, expect, it } from 'vitest'
import { verdadCasoSchema } from '../types'

const base = {
  version: '1.0' as const,
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado' as const,
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

describe('verdadCasoSchema', () => {
  it('acepta un caso prismatico con tres cotas', () => {
    expect(verdadCasoSchema.parse(base).caso_id).toBe('ejemplo-001')
  })

  it('acepta un caso cilindrico con dos cotas en orden diametro-longitud', () => {
    const caso = { ...base, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120] } }
    expect(verdadCasoSchema.parse(caso).dimensiones.cotas_mm).toEqual([40, 120])
  })

  it('rechaza un prismatico con solo dos cotas', () => {
    const caso = { ...base, dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80] } }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('rechaza un cilindrico con tres cotas', () => {
    const caso = { ...base, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120, 10] } }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('acepta precio de referencia con fuente y fecha', () => {
    const caso = {
      ...base,
      precio_referencia: { valor_eur: 480, cantidad: 10, fuente: 'Xometry instant quote', fecha: '2026-08-05' },
    }
    expect(verdadCasoSchema.parse(caso).precio_referencia?.valor_eur).toBe(480)
  })

  it('rechaza plazo_dias en cero', () => {
    expect(() => verdadCasoSchema.parse({ ...base, plazo_dias: 0 })).toThrow()
  })
})
