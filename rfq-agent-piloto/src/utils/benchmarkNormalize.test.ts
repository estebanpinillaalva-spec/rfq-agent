import { describe, expect, it } from 'vitest'
import { claseISO2768, clasificarAcabado } from './benchmarkNormalize'

describe('claseISO2768', () => {
  it('extrae clase lineal y geometrica', () => {
    expect(claseISO2768('ISO 2768-mK')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('tolera espacios y minusculas', () => {
    expect(claseISO2768('iso 2768 mk')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('extrae solo la lineal cuando no hay geometrica', () => {
    expect(claseISO2768('ISO 2768-f')).toEqual({ lineal: 'f', geometrica: null })
  })

  it('devuelve nulos cuando no reconoce la norma', () => {
    expect(claseISO2768('segun plano')).toEqual({ lineal: null, geometrica: null })
  })
})

describe('clasificarAcabado', () => {
  it('reconoce mecanizado', () => {
    expect(clasificarAcabado('Mecanizado')).toBe('mecanizado')
  })

  it('reconoce anodizado con matices', () => {
    expect(clasificarAcabado('anodizado duro negro')).toBe('anodizado')
  })

  it('reconoce cincado escrito como zincado', () => {
    expect(clasificarAcabado('zincado')).toBe('cincado')
  })

  it('marca NO_CLASIFICABLE lo que no encaja', () => {
    expect(clasificarAcabado('segun norma interna del cliente')).toBe('NO_CLASIFICABLE')
  })
})
