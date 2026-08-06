import {
  calcularMetricas,
  CAMPOS_NUCLEO,
  type CampoNucleo,
  type EstadoCampo,
  type Metricas,
  type ResultadoCaso,
} from './benchmarkCompare'

export interface RepeticionBenchmark {
  repeticion: number
  caso_id: string
  resultado: ResultadoCaso
  desviacionPrecio: number | null
  durationMs: number
}

export interface MetricasMedianas {
  aciertos: number | null
  fallos: number | null
  no_encontrados: number | null
  acierto_pct: number | null
  invencion_pct: number | null
}

export interface RangoMediana {
  mediana: number | null
  minimo: number | null
  maximo: number | null
}

export interface VarianzaCampo {
  acierto: RangoMediana
  invencion: RangoMediana
}

export interface MetricasRepeticiones {
  metricas_por_campo: Record<CampoNucleo, MetricasMedianas>
  metricas_globales: MetricasMedianas
  varianza_por_campo: Record<CampoNucleo, VarianzaCampo>
}

export interface ConteoEstados {
  aciertos: number
  fallos: number
  no_encontrados: number
  total: number
}

export interface ConteoPieza {
  caso_id: string
  numero_plano: string
  campos: Record<CampoNucleo, ConteoEstados>
}

export interface ResumenDeteccion {
  caso_id: string
  esperadas: number
  detectadas_mediana: number
  detectadas_minimo: number
  detectadas_maximo: number
  repeticiones_validas: number
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
    : ordenados[mitad]
}

export function agregarMetricasRepeticiones(repeticiones: RepeticionBenchmark[]): MetricasRepeticiones {
  const porCorrida = agruparPorNumeroRepeticion(repeticiones)
  const metricasGlobales = [...porCorrida.values()]
    .map((corrida) => camposDe(corrida))
    .filter((campos) => campos.length > 0)
    .map(calcularMetricas)

  const metricasPorCampo = Object.fromEntries(
    CAMPOS_NUCLEO.map((campo) => {
      const metricas = [...porCorrida.values()]
        .map((corrida) => camposDe(corrida).filter((resultado) => resultado.campo === campo))
        .filter((resultados) => resultados.length > 0)
        .map(calcularMetricas)
      return [campo, medianasMetricas(metricas)]
    })
  ) as Record<CampoNucleo, MetricasMedianas>

  const varianzaPorCampo = Object.fromEntries(
    CAMPOS_NUCLEO.map((campo) => {
      const metricas = [...porCorrida.values()]
        .map((corrida) => camposDe(corrida).filter((resultado) => resultado.campo === campo))
        .filter((resultados) => resultados.length > 0)
        .map(calcularMetricas)
      return [campo, {
        acierto: rango(metricas.map((item) => item.acierto_pct)),
        invencion: rango(metricas.map((item) => item.invencion_pct)),
      }]
    })
  ) as Record<CampoNucleo, VarianzaCampo>

  return {
    metricas_por_campo: metricasPorCampo,
    metricas_globales: medianasMetricas(metricasGlobales),
    varianza_por_campo: varianzaPorCampo,
  }
}

export function contarEstadosPorPieza(repeticiones: RepeticionBenchmark[]): ConteoPieza[] {
  return [...agruparPorCaso(repeticiones).entries()].flatMap(([casoId, corridas]) => {
    const numerosPlano = new Set<string>()
    for (const corrida of corridas) {
      corrida.resultado.piezas.forEach((pieza) => numerosPlano.add(pieza.numero_plano))
      corrida.resultado.deteccion.no_detectadas.forEach((numero) => numerosPlano.add(numero))
    }

    return [...numerosPlano].map((numeroPlano) => ({
      caso_id: casoId,
      numero_plano: numeroPlano,
      campos: Object.fromEntries(
        CAMPOS_NUCLEO.map((campo) => [campo, contarCampo(corridas, numeroPlano, campo)])
      ) as Record<CampoNucleo, ConteoEstados>,
    }))
  })
}

export function resumirDeteccion(repeticiones: RepeticionBenchmark[]): ResumenDeteccion[] {
  return [...agruparPorCaso(repeticiones).entries()].map(([casoId, corridas]) => {
    const detectadas = corridas.map((corrida) => corrida.resultado.deteccion.detectadas)
    return {
      caso_id: casoId,
      esperadas: corridas[0].resultado.deteccion.esperadas,
      detectadas_mediana: mediana(detectadas) ?? 0,
      detectadas_minimo: Math.min(...detectadas),
      detectadas_maximo: Math.max(...detectadas),
      repeticiones_validas: corridas.length,
    }
  })
}

function contarCampo(
  repeticiones: RepeticionBenchmark[],
  numeroPlano: string,
  campo: CampoNucleo
): ConteoEstados {
  const conteo: ConteoEstados = { aciertos: 0, fallos: 0, no_encontrados: 0, total: repeticiones.length }
  for (const repeticion of repeticiones) {
    const pieza = repeticion.resultado.piezas.find((item) => item.numero_plano === numeroPlano)
    const estado = pieza?.campos.find((item) => item.campo === campo)?.estado ?? 'NO_ENCONTRADO'
    incrementar(conteo, estado)
  }
  return conteo
}

function incrementar(conteo: ConteoEstados, estado: EstadoCampo): void {
  if (estado === 'ACIERTO') conteo.aciertos += 1
  else if (estado === 'FALLO') conteo.fallos += 1
  else conteo.no_encontrados += 1
}

function medianasMetricas(metricas: Metricas[]): MetricasMedianas {
  return {
    aciertos: mediana(metricas.map((item) => item.aciertos)),
    fallos: mediana(metricas.map((item) => item.fallos)),
    no_encontrados: mediana(metricas.map((item) => item.no_encontrados)),
    acierto_pct: mediana(metricas.map((item) => item.acierto_pct)),
    invencion_pct: mediana(metricas.map((item) => item.invencion_pct)),
  }
}

function rango(valores: number[]): RangoMediana {
  return {
    mediana: mediana(valores),
    minimo: valores.length === 0 ? null : Math.min(...valores),
    maximo: valores.length === 0 ? null : Math.max(...valores),
  }
}

function camposDe(repeticiones: RepeticionBenchmark[]) {
  return repeticiones.flatMap((repeticion) => repeticion.resultado.piezas.flatMap((pieza) => pieza.campos))
}

function agruparPorNumeroRepeticion(repeticiones: RepeticionBenchmark[]): Map<number, RepeticionBenchmark[]> {
  const grupos = new Map<number, RepeticionBenchmark[]>()
  for (const repeticion of repeticiones) {
    const grupo = grupos.get(repeticion.repeticion) ?? []
    grupo.push(repeticion)
    grupos.set(repeticion.repeticion, grupo)
  }
  return grupos
}

function agruparPorCaso(repeticiones: RepeticionBenchmark[]): Map<string, RepeticionBenchmark[]> {
  const grupos = new Map<string, RepeticionBenchmark[]>()
  for (const repeticion of repeticiones) {
    const grupo = grupos.get(repeticion.caso_id) ?? []
    grupo.push(repeticion)
    grupos.set(repeticion.caso_id, grupo)
  }
  return grupos
}
