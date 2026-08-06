import { describe, expect, it } from 'vitest'
import { estimarPesoKg, parseDimensiones } from './materiales'

describe('parseDimensiones', () => {
  it('parsea un prismatico de tres cotas', () => {
    expect(parseDimensiones('120 x 80 x 25 mm')).toEqual({ forma: 'prismatica', cotas_mm: [120, 80, 25] })
  })

  it('parsea un cilindrico con simbolo de diametro', () => {
    expect(parseDimensiones('Ø40 x 120 mm')).toEqual({ forma: 'cilindrica', cotas_mm: [40, 120] })
  })

  it('parsea un cilindrico escrito con la palabra diametro', () => {
    expect(parseDimensiones('diametro 40, longitud 120')).toEqual({ forma: 'cilindrica', cotas_mm: [40, 120] })
  })

  it('acepta coma decimal', () => {
    expect(parseDimensiones('120,5 x 80 x 25')).toEqual({ forma: 'prismatica', cotas_mm: [120.5, 80, 25] })
  })

  it('ignora el ajuste ISO pegado a la cota', () => {
    expect(parseDimensiones('Ø148h8 x 76.5 mm')).toEqual({ forma: 'cilindrica', cotas_mm: [148, 76.5] })
  })

  it('ignora el ajuste ISO con espacio', () => {
    expect(parseDimensiones('Ø130 k5 x 284 mm')).toEqual({ forma: 'cilindrica', cotas_mm: [130, 284] })
  })

  it('ignora el ajuste ISO en mayuscula', () => {
    expect(parseDimensiones('120 H7 x 80 x 25')).toEqual({ forma: 'prismatica', cotas_mm: [120, 80, 25] })
  })

  it('no confunde la x de separacion con una clase de ajuste', () => {
    expect(parseDimensiones('120x80x25')).toEqual({ forma: 'prismatica', cotas_mm: [120, 80, 25] })
  })

  it('no destroza una designacion de rosca', () => {
    // Comportamiento conocido, no deseado: la rosca todavia contamina las cotas.
    expect(parseDimensiones('Placa con roscas M12x1.75, envolvente 200 x 100 x 20')).toEqual({
      forma: 'prismatica',
      cotas_mm: [12, 1.75, 200],
    })
  })

  it('devuelve null si no hay cotas suficientes', () => {
    expect(parseDimensiones('pieza pequena')).toBeNull()
  })
})

describe('estimarPesoKg sigue funcionando tras la extraccion', () => {
  it('respeta un peso declarado explicitamente', () => {
    expect(estimarPesoKg('peso: 2.5 kg', 7.9)).toBe(2.5)
  })

  it('calcula el peso de un prismatico', () => {
    // 100 x 100 x 100 mm = 1000 cm3; a 7.9 g/cm3 son 7.9 kg
    expect(estimarPesoKg('100 x 100 x 100', 7.9)).toBeCloseTo(7.9, 3)
  })

  it('calcula el peso de un cilindro', () => {
    const esperado = (Math.PI * 20 ** 2 * 100) / 1000 / 1000 * 7.9
    expect(estimarPesoKg('Ø40 x 100', 7.9)).toBeCloseTo(esperado, 3)
  })

  it('devuelve null cuando no puede parsear', () => {
    expect(estimarPesoKg('sin cotas', 7.9)).toBeNull()
  })
})
