import { describe, expect, it } from 'vitest'
import type { CampoNucleo, EstadoCampo, ResultadoCaso } from './benchmarkCompare'
import {
  agregarMetricasRepeticiones,
  contarEstadosPorPieza,
  mediana,
  type RepeticionBenchmark,
} from './benchmarkAgregar'

function resultado(
  casoId: string,
  estados: Partial<Record<CampoNucleo, EstadoCampo>>,
  detectada = true
): ResultadoCaso {
  const numeroPlano = '11.01'
  return {
    caso_id: casoId,
    piezas: detectada
      ? [{
          numero_plano: numeroPlano,
          campos: Object.entries(estados).map(([campo, estado]) => ({
            campo: campo as CampoNucleo,
            estado,
            esperado: '',
            obtenido: '',
          })),
        }]
      : [],
    deteccion: {
      esperadas: 1,
      detectadas: detectada ? 1 : 0,
      no_detectadas: detectada ? [] : [numeroPlano],
      sobrantes: [],
    },
    errores_dataset: [],
  }
}

function repeticion(numero: number, casoId: string, resultadoCaso: ResultadoCaso): RepeticionBenchmark {
  return {
    repeticion: numero,
    caso_id: casoId,
    resultado: resultadoCaso,
    desviacionPrecio: null,
    durationMs: 100,
  }
}

describe('mediana', () => {
  it('calcula la mediana de una lista impar', () => {
    expect(mediana([9, 1, 5])).toBe(5)
  })

  it('calcula la mediana de una lista par como la media de los dos centrales', () => {
    expect(mediana([10, 2, 8, 4])).toBe(6)
  })

  it('devuelve el unico elemento de una lista de uno', () => {
    expect(mediana([7])).toBe(7)
  })
})

describe('agregarMetricasRepeticiones', () => {
  it('calcula mediana y rango por campo entre corridas', () => {
    const repeticiones = [
      repeticion(1, 'ejemplo-002', resultado('ejemplo-002', { material: 'ACIERTO' })),
      repeticion(2, 'ejemplo-002', resultado('ejemplo-002', { material: 'FALLO' })),
      repeticion(3, 'ejemplo-002', resultado('ejemplo-002', { material: 'FALLO' })),
    ]

    const agregado = agregarMetricasRepeticiones(repeticiones)

    expect(agregado.metricas_por_campo.material.acierto_pct).toBe(0)
    expect(agregado.varianza_por_campo.material.acierto).toEqual({ mediana: 0, minimo: 0, maximo: 100 })
    expect(agregado.varianza_por_campo.material.invencion).toEqual({ mediana: 100, minimo: 0, maximo: 100 })
  })
})

describe('contarEstadosPorPieza', () => {
  it('cuenta una pieza no detectada como no encontrada en la repeticion valida', () => {
    const repeticiones = [
      repeticion(1, 'ejemplo-002', resultado('ejemplo-002', { material: 'ACIERTO' })),
      repeticion(2, 'ejemplo-002', resultado('ejemplo-002', {}, false)),
    ]

    const [pieza] = contarEstadosPorPieza(repeticiones)

    expect(pieza.campos.material).toEqual({ aciertos: 1, fallos: 0, no_encontrados: 1, total: 2 })
  })
})
