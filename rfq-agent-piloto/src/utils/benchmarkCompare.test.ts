import { describe, expect, it } from 'vitest'
import { calcularMetricas, compararCaso } from './benchmarkCompare'
import type { AnalisisRFQ, MaterialBiblioteca, PiezaAnalisis, VerdadCaso } from '../types'

const biblioteca: MaterialBiblioteca = {
  version: '1.1',
  moneda: 'EUR',
  unidad_precio: 'kg',
  updated_at: '2026-08-01',
  stale_after_days: 45,
  fuentes_publicas: [],
  materiales: [
    {
      id: 'inox_304',
      nombre: 'AISI 304',
      familia: 'inox',
      aliases: ['X5CrNi18-10', '1.4301'],
      densidad_g_cm3: 7.9,
      formato_habitual: 'chapa',
      precio_eur_kg: 6,
      desperdicio_pct: 0.15,
      minimo_compra_kg: 1,
      proveedor: 'Proveedor local',
      fecha_actualizacion: '2026-08-01',
      confianza: 'ALTA',
      fuente_referencia: 'Precio local editable del taller',
      notas: '',
    },
  ],
}

const verdad: VerdadCaso = {
  version: '1.0',
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado',
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica', cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

function pieza(overrides: Partial<PiezaAnalisis>): PiezaAnalisis {
  return {
    denominacion: 'Placa base',
    numero_plano: 'PL-0001',
    revision_plano: '',
    escala: '',
    cajetin_texto: '',
    material_fuente: '',
    cantidad_fuente: '',
    dimensiones_fuente: '',
    tolerancias_fuente: '',
    acabado_fuente: '',
    revision_fuente: '',
    material: 'AISI 304',
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

function analisis(overrides: Partial<PiezaAnalisis>, plazo = '15 dias'): AnalisisRFQ {
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

function estadoDe(resultado: ReturnType<typeof compararCaso>, campo: string): string {
  return resultado.campos.find((item) => item.campo === campo)?.estado ?? 'AUSENTE'
}

describe('compararCaso', () => {
  it('acierta los siete campos cuando todo coincide', () => {
    const resultado = compararCaso(verdad, analisis({}), biblioteca)
    expect(resultado.campos).toHaveLength(7)
    expect(resultado.campos.every((campo) => campo.estado === 'ACIERTO')).toBe(true)
  })

  it('acierta el material por alias normalizado', () => {
    const resultado = compararCaso(verdad, analisis({ material: '1.4301' }), biblioteca)
    expect(estadoDe(resultado, 'material')).toBe('ACIERTO')
  })

  it('acierta dimensiones aunque las cotas vengan desordenadas', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: '25 x 120 x 80' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('ACIERTO')
  })

  it('acepta una cota dentro de la banda del 2 por ciento', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: '121 x 80 x 25' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('ACIERTO')
  })

  it('falla si la forma no coincide', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: 'Ø120 x 80' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('FALLO')
  })

  it('falla si pierde la clase geometrica de la tolerancia', () => {
    const resultado = compararCaso(verdad, analisis({ tolerancias_generales: 'ISO 2768-m' }), biblioteca)
    expect(estadoDe(resultado, 'tolerancia_general')).toBe('FALLO')
  })

  it('falla si el acabado no es clasificable', () => {
    const resultado = compararCaso(verdad, analisis({ acabado: 'segun norma interna' }), biblioteca)
    expect(estadoDe(resultado, 'acabado')).toBe('FALLO')
  })

  it('marca NO_ENCONTRADO lo que el modelo declara no haber encontrado', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['acabado'] }), biblioteca)
    expect(estadoDe(resultado, 'acabado')).toBe('NO_ENCONTRADO')
  })

  it('anota error de dataset si el analisis trae mas de una pieza', () => {
    const base = analisis({})
    const conDos: AnalisisRFQ = { ...base, piezas: [base.piezas[0], base.piezas[0]] }
    expect(compararCaso(verdad, conDos, biblioteca).errores_dataset).toHaveLength(1)
  })
})

describe('calcularMetricas', () => {
  it('separa acierto de invencion', () => {
    const metricas = calcularMetricas([
      { campo: 'material', estado: 'ACIERTO', esperado: '', obtenido: '' },
      { campo: 'cantidad', estado: 'ACIERTO', esperado: '', obtenido: '' },
      { campo: 'acabado', estado: 'FALLO', esperado: '', obtenido: '' },
      { campo: 'plazo_dias', estado: 'NO_ENCONTRADO', esperado: '', obtenido: '' },
    ])
    expect(metricas.acierto_pct).toBe(50)
    // 1 fallo sobre 3 valores arriesgados
    expect(metricas.invencion_pct).toBeCloseTo(33.33, 1)
  })

  it('no divide por cero cuando el modelo no arriesgo nada', () => {
    const metricas = calcularMetricas([{ campo: 'material', estado: 'NO_ENCONTRADO', esperado: '', obtenido: '' }])
    expect(metricas.invencion_pct).toBe(0)
  })
})
