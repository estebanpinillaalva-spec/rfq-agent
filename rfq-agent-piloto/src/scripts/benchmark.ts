import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { z } from 'zod'
import { analisisRFQSchema, presupuestoRFQSchema, type VerdadPieza } from '../types'
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

async function main(): Promise<void> {
  const casosDir = resolve('benchmark', 'casos')
  const proveedor = process.env.RFQ_BENCHMARK_PROVIDER ?? 'mock'
  const biblioteca = cargarBibliotecaMateriales()
  const nombres = (await readdir(casosDir).catch(() => [])).filter((n) => !n.startsWith('.'))

  const filas: FilaCaso[] = []
  const erroresDataset: string[] = []

  for (const nombre of nombres) {
    const carpeta = join(casosDir, nombre)
    let verdad
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

    const antes = await listarSalidas()
    const inicio = Date.now()
    const proceso = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', carpeta], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, RFQ_AI_PROVIDER: proveedor },
    })
    const durationMs = Date.now() - inicio

    if (proceso.status !== 0) {
      erroresDataset.push(`${nombre}: el pipeline fallo - ${(proceso.stderr || proceso.stdout).split(/\r?\n/).slice(-3).join(' ')}`)
      continue
    }

    const salida = await salidaNueva(antes)
    if (!salida) {
      erroresDataset.push(`${nombre}: no se detecto salida nueva`)
      continue
    }

    const crudo = await readFile(join(resolve('salidas'), salida, 'analisis.json'), 'utf8')
    const contenido = JSON.parse(crudo) as { analisis: unknown; presupuesto: unknown }
    const analisis = analisisRFQSchema.parse(contenido.analisis)
    const presupuesto = presupuestoRFQSchema.parse(contenido.presupuesto)

    filas.push({
      resultado: compararCaso(verdad, analisis, biblioteca),
      desviacionPrecio: desviacion(verdad.piezas[0], presupuesto.lineas[0]?.pvp_unitario ?? null),
      durationMs,
    })
  }

  await escribirInforme(proveedor, filas, erroresDataset)
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

main().catch((error: unknown) => {
  console.error(`Error: ${mensaje(error)}`)
  process.exitCode = 1
})
