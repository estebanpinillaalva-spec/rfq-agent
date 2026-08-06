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

const piezaVerdad: VerdadCaso['piezas'][number] = {
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica', cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

const verdad: VerdadCaso = {
  version: '2.0',
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado',
  piezas: [piezaVerdad],
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
  return resultado.piezas.flatMap((piezaComparada) => piezaComparada.campos).find((item) => item.campo === campo)?.estado ?? 'AUSENTE'
}

describe('compararCaso', () => {
  it('acierta los siete campos cuando todo coincide', () => {
    const resultado = compararCaso(verdad, analisis({}), biblioteca)
    expect(resultado.piezas[0].campos).toHaveLength(7)
    expect(resultado.piezas[0].campos.every((campo) => campo.estado === 'ACIERTO')).toBe(true)
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

  it('no marca numero_plano cuando el modelo declara que falta la revision', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['Revisión del plano'] }), biblioteca)
    expect(estadoDe(resultado, 'numero_plano')).toBe('ACIERTO')
  })

  it('marca numero_plano cuando el modelo declara que falta el numero de plano', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['Número de plano'] }), biblioteca)
    expect(estadoDe(resultado, 'numero_plano')).toBe('NO_ENCONTRADO')
  })

  it('marca acabado con una etiqueta compuesta en lenguaje natural', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['Acabado superficial'] }), biblioteca)
    expect(estadoDe(resultado, 'acabado')).toBe('NO_ENCONTRADO')
  })

  it('marca cantidad con una etiqueta compuesta en lenguaje natural', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['Cantidad específica por pieza'] }), biblioteca)
    expect(estadoDe(resultado, 'cantidad')).toBe('NO_ENCONTRADO')
  })

  it('compara dos piezas emparejadas por numero de plano', () => {
    const base = analisis({})
    const segunda = pieza({ denominacion: 'Tapa', numero_plano: 'PL-0002' })
    const conDos: AnalisisRFQ = {
      ...base,
      cantidades: { 'Placa base': 10, Tapa: 5 },
      piezas: [base.piezas[0], segunda],
    }
    const verdadDos: VerdadCaso = {
      ...verdad,
      piezas: [piezaVerdad, { ...piezaVerdad, numero_plano: 'PL-0002', cantidad: 5 }],
    }
    const resultado = compararCaso(verdadDos, conDos, biblioteca)
    expect(resultado.piezas).toHaveLength(2)
    expect(resultado.deteccion).toEqual({ esperadas: 2, detectadas: 2, no_detectadas: [], sobrantes: [] })
  })

  it('una pieza no detectada no genera resultados de campo', () => {
    const verdadDos: VerdadCaso = {
      ...verdad,
      piezas: [piezaVerdad, { ...piezaVerdad, numero_plano: 'PL-0002', cantidad: 5 }],
    }
    const resultado = compararCaso(verdadDos, analisis({}), biblioteca)
    expect(resultado.deteccion.no_detectadas).toEqual(['PL-0002'])
    expect(resultado.piezas.flatMap((item) => item.campos)).toHaveLength(7)
  })

  it('registra como sobrante una pieza del analisis sin pareja', () => {
    const base = analisis({})
    const conSobrante: AnalisisRFQ = {
      ...base,
      piezas: [base.piezas[0], pieza({ denominacion: 'Tapa', numero_plano: 'PL-0002' })],
    }
    const resultado = compararCaso(verdad, conSobrante, biblioteca)
    expect(resultado.deteccion.sobrantes).toEqual(['PL-0002'])
    expect(resultado.piezas).toHaveLength(1)
  })

  it('empareja por numero de plano aunque el analisis venga en orden inverso', () => {
    const base = analisis({})
    const segunda = pieza({ denominacion: 'Tapa', numero_plano: 'PL-0002' })
    const invertido: AnalisisRFQ = {
      ...base,
      cantidades: { 'Placa base': 10, Tapa: 5 },
      piezas: [segunda, base.piezas[0]],
    }
    const verdadDos: VerdadCaso = {
      ...verdad,
      piezas: [piezaVerdad, { ...piezaVerdad, numero_plano: 'PL-0002', cantidad: 5 }],
    }
    const resultado = compararCaso(verdadDos, invertido, biblioteca)
    expect(resultado.piezas.map((item) => item.numero_plano)).toEqual(['PL-0001', 'PL-0002'])
    expect(resultado.piezas.flatMap((item) => item.campos).every((campo) => campo.estado === 'ACIERTO')).toBe(true)
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
