import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { z } from 'zod'
import { analisisRFQSchema, presupuestoRFQSchema, type VerdadCaso, type VerdadPieza } from '../types'
import {
  agregarMetricasRepeticiones,
  contarEstadosPorPieza,
  resumirDeteccion,
  type ConteoPieza,
  type MetricasMedianas,
  type RepeticionBenchmark,
  type ResumenDeteccion,
  type VarianzaCampo,
} from '../utils/benchmarkAgregar'
import { cargarBibliotecaMateriales } from '../utils/materiales'
import { cargarVerdadCaso } from '../utils/verdad'
import {
  calcularMetricas,
  compararCaso,
  CAMPOS_NUCLEO,
  type CampoNucleo,
  type Metricas,
  type ResultadoCaso,
} from '../utils/benchmarkCompare'

interface FilaCaso {
  resultado: ResultadoCaso
  desviacionPrecio: number | null
  durationMs: number
}

interface ResumenPrecio {
  mediana: number | null
  peor_caso: { caso_id: string; desviacion: number } | null
  casos_incluidos: number
  casos_excluidos: number
}

interface MetricasInforme extends Omit<Metricas, 'acierto_pct' | 'invencion_pct'> {
  acierto_pct: number | null
  invencion_pct: number | null
}

interface InformeCrudo {
  fecha: string
  proveedor: string
  casos: FilaCaso[]
  metricas_por_campo: Record<CampoNucleo, MetricasInforme>
  metricas_globales: MetricasInforme
  precio: ResumenPrecio
  duraciones_ms: Array<{ caso_id: string; durationMs: number }>
  errores_dataset: string[]
}

interface InformeRepetido {
  fecha: string
  proveedor: string
  repeticiones_solicitadas: number
  repeticiones: RepeticionCruda[]
  metricas_por_campo: Record<CampoNucleo, MetricasMedianas>
  metricas_globales: MetricasMedianas
  varianza_por_campo: Record<CampoNucleo, VarianzaCampo>
  precio: ResumenPrecio
  duraciones_ms: Array<{ caso_id: string; repeticion: number; durationMs: number }>
  errores_dataset: string[]
}

interface ConfigRepeticiones {
  cantidad: number
  error: string | null
}

interface RepeticionFallida {
  repeticion: number
  caso_id: string
  error: string
}

type RepeticionCruda = RepeticionBenchmark | RepeticionFallida

async function main(): Promise<void> {
  const casosDir = resolve('benchmark', 'casos')
  const proveedor = process.env.RFQ_BENCHMARK_PROVIDER ?? 'mock'
  const configRepeticiones = leerRepeticiones(process.env.RFQ_BENCHMARK_REPETICIONES)
  const biblioteca = cargarBibliotecaMateriales()
  const nombres = (await readdir(casosDir).catch(() => [])).filter((n) => !n.startsWith('.'))

  const repeticiones: RepeticionBenchmark[] = []
  const repeticionesCrudas: RepeticionCruda[] = []
  const erroresDataset: string[] = configRepeticiones.error ? [configRepeticiones.error] : []

  for (const nombre of nombres) {
    const carpeta = join(casosDir, nombre)
    let verdad: VerdadCaso | null
    try {
      verdad = await cargarVerdadCaso(carpeta)
    } catch (error) {
      if (error instanceof z.ZodError) {
        erroresDataset.push(formatearErrorVerdad(nombre, error))
      } else {
        erroresDataset.push(`${nombre}: verdad.json invalido - ${mensaje(error)}`)
      }
      continue
    }
    if (!verdad) {
      erroresDataset.push(`${nombre}: sin verdad.json`)
      continue
    }

    let exitosas = 0
    for (let repeticion = 1; repeticion <= configRepeticiones.cantidad; repeticion += 1) {
      const ejecucion = await ejecutarRepeticion(carpeta, nombre, repeticion, proveedor, verdad, biblioteca)
      if ('error' in ejecucion) {
        const prefijo = configRepeticiones.cantidad === 1 ? `${nombre}:` : `${nombre} repeticion ${repeticion}:`
        erroresDataset.push(`${prefijo} ${ejecucion.error}`)
        repeticionesCrudas.push({ repeticion, caso_id: nombre, error: ejecucion.error })
        continue
      }
      exitosas += 1
      repeticiones.push(ejecucion.repeticion)
      repeticionesCrudas.push(ejecucion.repeticion)
    }

    if (configRepeticiones.cantidad > 1 && exitosas === 0) {
      erroresDataset.push(`${nombre}: todas las repeticiones fallaron`)
    }
  }

  if (configRepeticiones.cantidad === 1) {
    const filas = repeticiones.map(({ resultado, desviacionPrecio, durationMs }) => ({
      resultado,
      desviacionPrecio,
      durationMs,
    }))
    await escribirInforme(proveedor, filas, erroresDataset)
  } else {
    await escribirInformeRepetido(
      proveedor,
      configRepeticiones.cantidad,
      repeticiones,
      repeticionesCrudas,
      erroresDataset
    )
  }
}

async function ejecutarRepeticion(
  carpeta: string,
  casoId: string,
  repeticion: number,
  proveedor: string,
  verdad: VerdadCaso,
  biblioteca: ReturnType<typeof cargarBibliotecaMateriales>
): Promise<{ repeticion: RepeticionBenchmark } | { error: string }> {
  try {
    const antes = await listarSalidas()
    const inicio = Date.now()
    const proceso = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', carpeta], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, RFQ_AI_PROVIDER: proveedor },
    })
    const durationMs = Date.now() - inicio

    if (proceso.status !== 0) {
      return { error: `el pipeline fallo - ${(proceso.stderr || proceso.stdout).split(/\r?\n/).slice(-3).join(' ')}` }
    }

    const salida = await salidaNueva(antes)
    if (!salida) return { error: 'no se detecto salida nueva' }

    const crudo = await readFile(join(resolve('salidas'), salida, 'analisis.json'), 'utf8')
    const contenido = JSON.parse(crudo) as { analisis: unknown; presupuesto: unknown }
    const analisis = analisisRFQSchema.parse(contenido.analisis)
    const presupuesto = presupuestoRFQSchema.parse(contenido.presupuesto)
    return {
      repeticion: {
        repeticion,
        caso_id: casoId,
        resultado: compararCaso(verdad, analisis, biblioteca),
        desviacionPrecio: desviacion(verdad.piezas[0], presupuesto.lineas[0]?.pvp_unitario ?? null),
        durationMs,
      },
    }
  } catch (error) {
    return { error: mensaje(error) }
  }
}

function leerRepeticiones(valor: string | undefined): ConfigRepeticiones {
  if (valor === undefined) return { cantidad: 1, error: null }
  const limpio = valor.trim()
  const cantidad = Number(limpio)
  if (!/^\d+$/.test(limpio) || !Number.isSafeInteger(cantidad) || cantidad < 1) {
    return {
      cantidad: 1,
      error: `RFQ_BENCHMARK_REPETICIONES invalido ("${valor}"); se usa 1`,
    }
  }
  return { cantidad, error: null }
}

async function listarSalidas(): Promise<string[]> {
  const entries = await readdir(resolve('salidas'), { withFileTypes: true }).catch(() => [])
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

async function salidaNueva(antes: string[]): Promise<string | null> {
  const previous = new Set(antes)
  const after = await listarSalidas()
  const created = after.filter((name) => !previous.has(name)).sort().reverse()
  return created[0] ?? null
}

function mensaje(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatearErrorVerdad(nombre: string, error: z.ZodError): string {
  const limite = 12
  const problemas = error.issues.slice(0, limite).map((issue) => {
    const ruta = issue.path
      .map((segmento, indice) => typeof segmento === 'number' ? `[${segmento}]` : `${indice === 0 ? '' : '.'}${segmento}`)
      .join('')
    return `${ruta}: ${issue.message}`
  })
  if (error.issues.length > limite) problemas.push(`... y ${error.issues.length - limite} problemas mas`)
  return [`${nombre}: verdad.json invalido (${error.issues.length} problemas)`, ...problemas].join('\n')
}

function desviacion(verdad: VerdadPieza, pvpUnitario: number | null): number | null {
  if (verdad.precio_referencia === null || pvpUnitario === null) return null
  const unitarioReferencia = verdad.precio_referencia.valor_eur / verdad.precio_referencia.cantidad
  return (pvpUnitario - unitarioReferencia) / unitarioReferencia
}

async function escribirInforme(proveedor: string, filas: FilaCaso[], erroresDataset: string[]): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10)
  const errores = [
    ...erroresDataset,
    ...filas.flatMap((fila) =>
      fila.resultado.errores_dataset.map((error) => `${fila.resultado.caso_id}: ${error}`)
    ),
  ]
  const todosLosCampos = filas.flatMap((fila) => fila.resultado.piezas.flatMap((pieza) => pieza.campos))
  const metricasPorCampo = Object.fromEntries(
    CAMPOS_NUCLEO.map((campo) => {
      const resultados = todosLosCampos.filter((resultado) => resultado.campo === campo)
      return [campo, metricasInforme(calcularMetricas(resultados), resultados.length > 0)]
    })
  ) as Record<CampoNucleo, MetricasInforme>
  const informe: InformeCrudo = {
    fecha,
    proveedor,
    casos: filas,
    metricas_por_campo: metricasPorCampo,
    metricas_globales: metricasInforme(calcularMetricas(todosLosCampos), todosLosCampos.length > 0),
    precio: resumirPrecio(filas),
    duraciones_ms: filas.map((fila) => ({
      caso_id: fila.resultado.caso_id,
      durationMs: fila.durationMs,
    })),
    errores_dataset: errores,
  }

  const directorio = resolve('benchmark', 'informes')
  await mkdir(directorio, { recursive: true })
  const base = join(directorio, `${fecha}-${proveedor}`)
  await writeFile(`${base}.md`, markdownInforme(informe), 'utf8')
  await writeFile(`${base}.json`, JSON.stringify(informe, null, 2), 'utf8')
  console.log(`Informes generados: ${base}.md y ${base}.json`)
}

async function escribirInformeRepetido(
  proveedor: string,
  repeticionesSolicitadas: number,
  repeticiones: RepeticionBenchmark[],
  repeticionesCrudas: RepeticionCruda[],
  erroresDataset: string[]
): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10)
  const metricas = agregarMetricasRepeticiones(repeticiones)
  const errores = [
    ...erroresDataset,
    ...repeticiones.flatMap((repeticion) =>
      repeticion.resultado.errores_dataset.map(
        (error) => `${repeticion.caso_id} repeticion ${repeticion.repeticion}: ${error}`
      )
    ),
  ]
  const informe: InformeRepetido = {
    fecha,
    proveedor,
    repeticiones_solicitadas: repeticionesSolicitadas,
    repeticiones: repeticionesCrudas,
    metricas_por_campo: metricas.metricas_por_campo,
    metricas_globales: metricas.metricas_globales,
    varianza_por_campo: metricas.varianza_por_campo,
    precio: resumirPrecio(repeticiones),
    duraciones_ms: repeticiones.map((repeticion) => ({
      caso_id: repeticion.caso_id,
      repeticion: repeticion.repeticion,
      durationMs: repeticion.durationMs,
    })),
    errores_dataset: errores,
  }

  const directorio = resolve('benchmark', 'informes')
  await mkdir(directorio, { recursive: true })
  const base = join(directorio, `${fecha}-${proveedor}`)
  await writeFile(`${base}.md`, markdownInformeRepetido(informe), 'utf8')
  await writeFile(`${base}.json`, JSON.stringify(informe, null, 2), 'utf8')
  console.log(`Informes generados: ${base}.md y ${base}.json`)
}

function resumirPrecio(filas: FilaCaso[]): ResumenPrecio {
  const incluidas = filas.filter(
    (fila): fila is FilaCaso & { desviacionPrecio: number } => fila.desviacionPrecio !== null
  )
  const ordenadas = incluidas.map((fila) => fila.desviacionPrecio).sort((a, b) => a - b)
  const mitad = Math.floor(ordenadas.length / 2)
  const mediana = ordenadas.length === 0
    ? null
    : ordenadas.length % 2 === 0
      ? (ordenadas[mitad - 1] + ordenadas[mitad]) / 2
      : ordenadas[mitad]
  const peor = incluidas.reduce<(FilaCaso & { desviacionPrecio: number }) | null>((actual, fila) => {
    if (!actual || Math.abs(fila.desviacionPrecio) > Math.abs(actual.desviacionPrecio)) return fila
    return actual
  }, null)
  return {
    mediana,
    peor_caso: peor === null
      ? null
      : { caso_id: peor.resultado.caso_id, desviacion: peor.desviacionPrecio },
    casos_incluidos: incluidas.length,
    casos_excluidos: filas.length - incluidas.length,
  }
}

function metricasInforme(metricas: Metricas, medidas: boolean): MetricasInforme {
  return {
    ...metricas,
    acierto_pct: medidas ? metricas.acierto_pct : null,
    invencion_pct: medidas ? metricas.invencion_pct : null,
  }
}

function markdownInforme(informe: InformeCrudo): string {
  const lineas: string[] = [
    '# Informe benchmark RFQ',
    '',
    `Fecha: ${informe.fecha}`,
    `Proveedor: ${informe.proveedor}`,
    '',
    '## Resultado por campo y caso',
    '',
    tablaCasos(informe.casos),
    '',
    '## Deteccion de piezas',
    '',
    tablaDeteccion(informe.casos),
    '',
    '## Metricas por campo',
    '',
    '| Campo | % acierto | % invencion |',
    '| --- | ---: | ---: |',
  ]

  for (const campo of CAMPOS_NUCLEO) {
    const metricas = informe.metricas_por_campo[campo]
    lineas.push(`| ${campo} | ${porcentaje(metricas.acierto_pct)} | ${porcentaje(metricas.invencion_pct)} |`)
  }

  lineas.push(
    '',
    '## Metricas globales',
    '',
    `- Aciertos: ${informe.metricas_globales.aciertos}`,
    `- Fallos: ${informe.metricas_globales.fallos}`,
    `- No encontrados: ${informe.metricas_globales.no_encontrados}`,
    `- % acierto: ${porcentaje(informe.metricas_globales.acierto_pct)}`,
    `- % invencion: ${porcentaje(informe.metricas_globales.invencion_pct)}`,
    '',
    '## Desviacion de precio unitario',
    '',
    `- Mediana: ${informe.precio.mediana === null ? 'Sin datos' : porcentaje(informe.precio.mediana * 100)}`,
    `- Peor caso: ${informe.precio.peor_caso === null ? 'Sin datos' : `${informe.precio.peor_caso.caso_id} (${porcentaje(informe.precio.peor_caso.desviacion * 100)})`}`,
    `- Casos incluidos: ${informe.precio.casos_incluidos}`,
    `- Casos excluidos sin precio de referencia: ${informe.precio.casos_excluidos}`,
    '',
    '## Duracion por caso',
    '',
    '| Caso | Duracion (ms) |',
    '| --- | ---: |'
  )

  if (informe.duraciones_ms.length === 0) {
    lineas.push('| Sin casos evaluables | - |')
  } else {
    for (const duracion of informe.duraciones_ms) {
      lineas.push(`| ${duracion.caso_id} | ${duracion.durationMs} |`)
    }
  }

  lineas.push('', '## Errores de dataset', '')
  if (informe.errores_dataset.length === 0) {
    lineas.push('- Ninguno')
  } else {
    lineas.push(...informe.errores_dataset.map((error) => `- ${error}`))
  }
  lineas.push('')
  return lineas.join('\n')
}

function markdownInformeRepetido(informe: InformeRepetido): string {
  const repeticionesExitosas = informe.repeticiones.filter(
    (repeticion): repeticion is RepeticionBenchmark => 'resultado' in repeticion
  )
  const conteos = contarEstadosPorPieza(repeticionesExitosas)
  const detecciones = resumirDeteccion(repeticionesExitosas)
  const lineas: string[] = [
    '# Informe benchmark RFQ',
    '',
    `Fecha: ${informe.fecha}`,
    `Proveedor: ${informe.proveedor}`,
    `Repeticiones: ${informe.repeticiones_solicitadas}`,
    '',
    '## Resultado por campo y caso',
    '',
    tablaCasosRepetidos(conteos),
    '',
    leyendaConteos(conteos),
    '',
    '## Deteccion de piezas',
    '',
    tablaDeteccionRepetida(detecciones),
    '',
    '## Metricas por campo',
    '',
    '| Campo | % acierto | % invencion |',
    '| --- | ---: | ---: |',
  ]

  for (const campo of CAMPOS_NUCLEO) {
    const metricas = informe.metricas_por_campo[campo]
    lineas.push(`| ${campo} | ${porcentaje(metricas.acierto_pct)} | ${porcentaje(metricas.invencion_pct)} |`)
  }

  lineas.push(
    '',
    '## Varianza entre corridas',
    '',
    '| Campo | % acierto mediana | rango | % invencion mediana | rango |',
    '| --- | ---: | --- | ---: | --- |'
  )
  for (const campo of CAMPOS_NUCLEO) {
    const varianza = informe.varianza_por_campo[campo]
    lineas.push(
      `| ${campo} | ${porcentaje(varianza.acierto.mediana)} | ${rangoPorcentaje(varianza.acierto)} | ${porcentaje(varianza.invencion.mediana)} | ${rangoPorcentaje(varianza.invencion)} |`
    )
  }
  lineas.push('')
  if (detecciones.length === 0) {
    lineas.push('- Sin casos evaluables.')
  } else {
    for (const deteccion of detecciones) {
      lineas.push(
        `- ${deteccion.caso_id}: detectadas ${numero(deteccion.detectadas_mediana)} (mediana), rango ${deteccion.detectadas_minimo}–${deteccion.detectadas_maximo} de ${deteccion.esperadas} esperadas.`
      )
    }
  }

  lineas.push(
    '',
    '## Metricas globales',
    '',
    `- Aciertos: ${numero(informe.metricas_globales.aciertos)}`,
    `- Fallos: ${numero(informe.metricas_globales.fallos)}`,
    `- No encontrados: ${numero(informe.metricas_globales.no_encontrados)}`,
    `- % acierto: ${porcentaje(informe.metricas_globales.acierto_pct)}`,
    `- % invencion: ${porcentaje(informe.metricas_globales.invencion_pct)}`,
    '',
    '## Desviacion de precio unitario',
    '',
    `- Mediana: ${informe.precio.mediana === null ? 'Sin datos' : porcentaje(informe.precio.mediana * 100)}`,
    `- Peor caso: ${informe.precio.peor_caso === null ? 'Sin datos' : `${informe.precio.peor_caso.caso_id} (${porcentaje(informe.precio.peor_caso.desviacion * 100)})`}`,
    `- Casos incluidos: ${informe.precio.casos_incluidos}`,
    `- Casos excluidos sin precio de referencia: ${informe.precio.casos_excluidos}`,
    '',
    '## Duracion por caso',
    '',
    '| Caso | Repeticion | Duracion (ms) |',
    '| --- | ---: | ---: |'
  )

  if (informe.duraciones_ms.length === 0) {
    lineas.push('| Sin casos evaluables | - | - |')
  } else {
    for (const duracion of informe.duraciones_ms) {
      lineas.push(`| ${duracion.caso_id} | ${duracion.repeticion} | ${duracion.durationMs} |`)
    }
  }

  lineas.push('', '## Errores de dataset', '')
  if (informe.errores_dataset.length === 0) {
    lineas.push('- Ninguno')
  } else {
    lineas.push(...informe.errores_dataset.map((error) => `- ${error}`))
  }
  lineas.push('')
  return lineas.join('\n')
}

function tablaCasosRepetidos(piezas: ConteoPieza[]): string {
  if (piezas.length === 0) return 'Sin casos evaluables'
  const casos = new Set(piezas.map((pieza) => pieza.caso_id))
  const etiqueta = (pieza: ConteoPieza) => casos.size === 1
    ? pieza.numero_plano
    : `${pieza.caso_id} / ${pieza.numero_plano}`
  const cabecera = `| Campo | ${piezas.map(etiqueta).join(' | ')} |`
  const separador = `| --- | ${piezas.map(() => '---').join(' | ')} |`
  const cuerpos = CAMPOS_NUCLEO.map((campo) => {
    const estados = piezas.map((pieza) => {
      const conteo = pieza.campos[campo]
      return `${conteo.aciertos}/${conteo.fallos}/${conteo.no_encontrados}`
    })
    return `| ${campo} | ${estados.join(' | ')} |`
  })
  return [cabecera, separador, ...cuerpos].join('\n')
}

function leyendaConteos(piezas: ConteoPieza[]): string {
  if (piezas.length === 0) return 'Formato: aciertos/fallos/no encontrados sobre 0 repeticiones.'
  const totalesPorCaso = new Map<string, number>()
  for (const pieza of piezas) {
    totalesPorCaso.set(pieza.caso_id, pieza.campos.numero_plano.total)
  }
  const totales = new Set(totalesPorCaso.values())
  if (totales.size === 1) {
    return `Formato: aciertos/fallos/no encontrados sobre ${[...totales][0]} repeticiones.`
  }
  const detalle = [...totalesPorCaso.entries()].map(([caso, total]) => `${caso}: ${total}`).join('; ')
  return `Formato: aciertos/fallos/no encontrados. Repeticiones validas por caso: ${detalle}.`
}

function tablaDeteccionRepetida(detecciones: ResumenDeteccion[]): string {
  const lineas = [
    '| Caso | Esperadas | Detectadas mediana | Rango | Repeticiones validas |',
    '| --- | ---: | ---: | --- | ---: |',
  ]
  if (detecciones.length === 0) {
    lineas.push('| Sin casos evaluables | - | - | - | - |')
    return lineas.join('\n')
  }
  for (const deteccion of detecciones) {
    lineas.push(
      `| ${deteccion.caso_id} | ${deteccion.esperadas} | ${numero(deteccion.detectadas_mediana)} | ${deteccion.detectadas_minimo}–${deteccion.detectadas_maximo} | ${deteccion.repeticiones_validas} |`
    )
  }
  return lineas.join('\n')
}

function tablaCasos(filas: FilaCaso[]): string {
  const piezas = filas.flatMap((fila) =>
    fila.resultado.piezas.map((pieza) => ({ caso_id: fila.resultado.caso_id, pieza }))
  )
  if (piezas.length === 0) {
    return 'Sin casos evaluables'
  }
  const cabecera = `| Campo | ${piezas.map(({ caso_id, pieza }) => `${caso_id} / ${pieza.numero_plano}`).join(' | ')} |`
  const separador = `| --- | ${piezas.map(() => '---').join(' | ')} |`
  const cuerpos = CAMPOS_NUCLEO.map((campo) => {
    const estados = piezas.map(({ pieza }) =>
      pieza.campos.find((resultado) => resultado.campo === campo)?.estado ?? 'NO_ENCONTRADO'
    )
    return `| ${campo} | ${estados.join(' | ')} |`
  })
  return [cabecera, separador, ...cuerpos].join('\n')
}

function tablaDeteccion(filas: FilaCaso[]): string {
  const lineas = [
    '| Caso | Esperadas | Detectadas | No detectadas | Sobrantes |',
    '| --- | ---: | ---: | --- | --- |',
  ]
  if (filas.length === 0) {
    lineas.push('| Sin casos evaluables | - | - | - | - |')
    return lineas.join('\n')
  }
  for (const fila of filas) {
    const deteccion = fila.resultado.deteccion
    lineas.push(
      `| ${fila.resultado.caso_id} | ${deteccion.esperadas} | ${deteccion.detectadas} | ${deteccion.no_detectadas.join(', ') || '-'} | ${deteccion.sobrantes.join(', ') || '-'} |`
    )
  }
  return lineas.join('\n')
}

function porcentaje(valor: number | null): string {
  return valor === null ? 'Sin datos' : `${valor.toFixed(2)}%`
}

function rangoPorcentaje(rango: VarianzaCampo['acierto']): string {
  if (rango.minimo === null || rango.maximo === null) return 'Sin datos'
  return `${rango.minimo.toFixed(2)}–${rango.maximo.toFixed(2)}`
}

function numero(valor: number | null): string {
  if (valor === null) return 'Sin datos'
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

main().catch((error: unknown) => {
  console.error(`Error: ${mensaje(error)}`)
  process.exitCode = 1
})
