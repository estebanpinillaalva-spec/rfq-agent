import { describe, expect, it } from 'vitest'
import { claseToleranciaGeneral, clasificarAcabado } from './benchmarkNormalize'

describe('claseToleranciaGeneral', () => {
  it('extrae clase lineal y geometrica', () => {
    expect(claseToleranciaGeneral('ISO 2768-mK')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('tolera espacios y minusculas', () => {
    expect(claseToleranciaGeneral('iso 2768 mk')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('extrae solo la lineal cuando no hay geometrica', () => {
    expect(claseToleranciaGeneral('ISO 2768-f')).toEqual({ lineal: 'f', geometrica: null })
  })

  it('devuelve nulos cuando no reconoce la norma', () => {
    expect(claseToleranciaGeneral('segun plano')).toEqual({ lineal: null, geometrica: null })
  })

  it('reconoce la adopcion española UNE EN 22768', () => {
    expect(claseToleranciaGeneral('Tol. no indicadas UNE EN 22768-m')).toEqual({ lineal: 'm', geometrica: null })
  })

  it('reconoce la equivalente alemana DIN 7168', () => {
    expect(claseToleranciaGeneral('DIN 7168-m')).toEqual({ lineal: 'm', geometrica: null })
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

  it('clasifica los grados N de rugosidad como mecanizado', () => {
    expect(clasificarAcabado('N7')).toBe('mecanizado')
    expect(clasificarAcabado('N9 (N7)')).toBe('mecanizado')
  })

  it('clasifica valores Ra como mecanizado', () => {
    expect(clasificarAcabado('Ra 1,6')).toBe('mecanizado')
  })

  it('un tratamiento declarado gana a la nota de rugosidad', () => {
    expect(clasificarAcabado('anodizado duro, N7')).toBe('anodizado')
  })

  it('sigue marcando NO_CLASIFICABLE lo que no encaja', () => {
    expect(clasificarAcabado('segun norma interna del cliente')).toBe('NO_CLASIFICABLE')
  })
})
