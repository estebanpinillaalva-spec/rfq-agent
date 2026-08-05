import { describe, expect, it } from 'vitest'
import { verdadCasoSchema } from '../types'

const piezaBase = {
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

const base = {
  version: '2.0' as const,
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado' as const,
  piezas: [piezaBase],
}

describe('verdadCasoSchema', () => {
  it('acepta un caso prismatico con tres cotas', () => {
    expect(verdadCasoSchema.parse(base).caso_id).toBe('ejemplo-001')
  })

  it('acepta un caso cilindrico con dos cotas en orden diametro-longitud', () => {
    const caso = {
      ...base,
      piezas: [{ ...piezaBase, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120] } }],
    }
    expect(verdadCasoSchema.parse(caso).piezas[0].dimensiones.cotas_mm).toEqual([40, 120])
  })

  it('rechaza un prismatico con solo dos cotas', () => {
    const caso = {
      ...base,
      piezas: [{ ...piezaBase, dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80] } }],
    }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('rechaza un cilindrico con tres cotas', () => {
    const caso = {
      ...base,
      piezas: [{ ...piezaBase, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120, 10] } }],
    }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('acepta precio de referencia con fuente y fecha', () => {
    const caso = {
      ...base,
      piezas: [
        {
          ...piezaBase,
          precio_referencia: {
            valor_eur: 480,
            cantidad: 10,
            fuente: 'Xometry instant quote',
            fecha: '2026-08-05',
          },
        },
      ],
    }
    expect(verdadCasoSchema.parse(caso).piezas[0].precio_referencia?.valor_eur).toBe(480)
  })

  it('rechaza plazo_dias en cero', () => {
    expect(() => verdadCasoSchema.parse({ ...base, piezas: [{ ...piezaBase, plazo_dias: 0 }] })).toThrow()
  })
})
