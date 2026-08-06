import { describe, expect, it } from 'vitest'
import type { AnalisisRFQ, PiezaAnalisis } from '../types'
import { contieneAsuncion, reconciliarHonestidad } from './honestidad'

function pieza(overrides: Partial<PiezaAnalisis> = {}): PiezaAnalisis {
  return {
    denominacion: 'Placa base',
    numero_plano: 'PL-0001',
    revision_plano: 'A',
    escala: '1:1',
    cajetin_texto: '',
    material_fuente: '',
    cantidad_fuente: '',
    dimensiones_fuente: '',
    tolerancias_fuente: '',
    acabado_fuente: '',
    revision_fuente: '',
    material: 'F-1120',
    dimensiones: '120 x 80 x 25 mm',
    tolerancias_generales: 'ISO 2768-mK',
    tolerancias_criticas: [],
    gdt: [],
    acabado: 'mecanizado',
    tratamientos: [],
    recubrimientos: [],
    roscas: [],
    agujeros: [],
    ajustes: [],
    chaflanes_radios: [],
    rugosidades: [],
    notas_plano: [],
    zonas_revisadas: [],
    campos_no_encontrados: [],
    operaciones: ['fresado'],
    caracteristicas_criticas: [],
    complejidad: 'MEDIA',
    tiempo_estimado_min: 45,
    subcontratas: [],
    flags: [],
    ...overrides,
  }
}

function analisis(overrides: Partial<PiezaAnalisis> = {}, plazo = '15 dias'): AnalisisRFQ {
  return {
    ref_interna: 'RFQ-001',
    timestamp: '2026-08-05T10:00:00.000Z',
    cliente: { empresa: 'Cliente', contacto: 'Contacto', email: 'a@b.c', idioma: 'es' },
    cantidades: { 'Placa base': 10 },
    plazo_solicitado: plazo,
    piezas: [pieza(overrides)],
    dfm: { riesgos: [], sugerencias: [], ambiguedades: [] },
    complejidad_global: 'MEDIA',
    tiempo_total_min: 45,
    subcontratas_necesarias: [],
    email_respuesta: '',
    confidence_score: 0.8,
    requires_human_review: true,
    blocking_reasons: [],
  }
}

describe('reconciliarHonestidad', () => {
  it('descarta etiquetas fuera del vocabulario', () => {
    const resultado = reconciliarHonestidad(
      analisis({ campos_no_encontrados: ['Revisión del plano', 'Cosa rara', 'tolerancia_general_especifica'] })
    )
    expect(resultado.piezas[0].campos_no_encontrados).toEqual(['revision'])
  })

  it('normaliza acentos y espacios a clave canonica', () => {
    const resultado = reconciliarHonestidad(analisis({ campos_no_encontrados: ['Tolerancia general'] }))
    expect(resultado.piezas[0].campos_no_encontrados).toEqual(['tolerancia_general'])

    const conMatiz = reconciliarHonestidad(
      analisis({ campos_no_encontrados: ['Tolerancia general (clase exacta)'] })
    )
    expect(conMatiz.piezas[0].campos_no_encontrados).toEqual(['tolerancia_general'])
  })

  it('vacia el material cuando se declara no encontrado', () => {
    const resultado = reconciliarHonestidad(analisis({ campos_no_encontrados: ['material'] }))
    expect(resultado.piezas[0].material).toBe('')
  })

  it('vacia el plazo del caso, no de la pieza', () => {
    const entrada = analisis({ campos_no_encontrados: ['plazo'] })
    const resultado = reconciliarHonestidad(entrada)
    expect(resultado.plazo_solicitado).toBe('')
    expect(resultado.piezas[0].material).toBe('F-1120')
  })

  it('detecta una asuncion y vacia el valor', () => {
    const valores = ['S235JR (asumido)', 'S235JR asumida', 'S235JR supuésto', 'S235JR SUPUESTA', 'S235JR por defecto']
    for (const valor of valores) {
      expect(contieneAsuncion(valor)).toBe(true)
      const resultado = reconciliarHonestidad(analisis({ material: valor }))
      expect(resultado.piezas[0].material).toBe('')
      expect(resultado.piezas[0].campos_no_encontrados).toContain('material')
    }
  })

  it('no toca un valor legitimo', () => {
    const entrada = analisis({ material: 'F-1120' })
    const resultado = reconciliarHonestidad(entrada)
    expect(resultado.piezas[0].material).toBe('F-1120')
    expect(resultado).not.toBe(entrada)
  })

  it('normaliza numero de plano y vacia su valor', () => {
    const resultado = reconciliarHonestidad(analisis({ campos_no_encontrados: ['Número de plano'] }))
    expect(resultado.piezas[0].campos_no_encontrados).toEqual(['numero_plano'])
    expect(resultado.piezas[0].numero_plano).toBe('')
  })

  it('normaliza acabado superficial y vacia su valor', () => {
    const resultado = reconciliarHonestidad(analisis({ campos_no_encontrados: ['Acabado superficial'] }))
    expect(resultado.piezas[0].campos_no_encontrados).toEqual(['acabado'])
    expect(resultado.piezas[0].acabado).toBe('')
  })

  it('normaliza cantidad especifica por pieza sin alterar cantidades', () => {
    const resultado = reconciliarHonestidad(
      analisis({ campos_no_encontrados: ['Cantidad específica por pieza'] })
    )
    expect(resultado.piezas[0].campos_no_encontrados).toEqual(['cantidad'])
    expect(resultado.cantidades).toEqual({ 'Placa base': 10 })
  })
})
