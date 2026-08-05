import { describe, expect, it } from 'vitest'
import { generarPresupuestoDeterminista } from './costingEngine'
import type { AnalisisRFQ, ConfigTaller, PiezaAnalisis } from '../types'

function config(minutosPorOperacion: Record<string, number>): ConfigTaller {
  return {
    nombre: 'Taller de prueba',
    cif: 'B00000000',
    email: 'taller@ejemplo.es',
    precios_hora: { fresado: 60 },
    margen_por_complejidad: { BAJA: 0.3, MEDIA: 0.35, ALTA: 0.4, MUY_ALTA: 0.5 },
    plazo_estandar_dias: 15,
    condiciones_pago: '30 dias',
    iva_porcentaje: 0.21,
    validez_dias: 15,
    overhead_porcentaje: 0.18,
    capacidad_diaria_horas: 7,
    materiales_eur_kg: {},
    setup_min_por_operacion: {},
    subcontratas: {},
    minutos_por_operacion: minutosPorOperacion,
  }
}

function pieza(): PiezaAnalisis {
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
  }
}

function analisis(): AnalisisRFQ {
  return {
    ref_interna: 'RFQ-001',
    timestamp: '2026-08-05T10:00:00.000Z',
    cliente: { empresa: 'Cliente', contacto: 'Contacto', email: 'a@b.c', idioma: 'es' },
    cantidades: { 'Placa base': 10 },
    plazo_solicitado: '15 dias',
    piezas: [pieza()],
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

describe('generarPresupuestoDeterminista y la fuente del tiempo', () => {
  it('marca estimacion_modelo y usa los minutos del modelo cuando la config no trae tabla', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({}))
    const desglose = presupuesto.lineas[0].desglose
    expect(desglose?.fuente_tiempo).toBe('estimacion_modelo')
    // 45 min a 60 EUR/h
    expect(desglose?.coste_operaciones).toBeCloseTo(45, 2)
  })

  it('marca tabla_taller y usa los minutos de la config cuando existen', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({ fresado: 90 }))
    const desglose = presupuesto.lineas[0].desglose
    expect(desglose?.fuente_tiempo).toBe('tabla_taller')
    // 90 min de la tabla a 60 EUR/h, ignorando los 45 del modelo
    expect(desglose?.coste_operaciones).toBeCloseTo(90, 2)
  })

  it('resuelve la clave de la tabla ignorando mayusculas y acentos', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({ Fresado: 90 }))
    expect(presupuesto.lineas[0].desglose?.fuente_tiempo).toBe('tabla_taller')
  })
})
