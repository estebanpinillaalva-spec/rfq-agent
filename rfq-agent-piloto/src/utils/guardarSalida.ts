import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const PILOT_ROOT = resolve(process.cwd())
import { timestampForPath } from './format'
import { buildQualityMarkdown, evaluarCalidadRFQ } from './qualityGate'
import { buildPresupuestoHtml, writeHtmlAndPdf } from './renderPdf'
import type { AnalisisRFQ, ConfigTaller, PlanoEntrada, PresupuestoRFQ, QualityReport, ValidacionPlano } from '../types'

export interface SalidaGuardada {
  directorio: string
  analisisPath: string
  presupuestoPath: string
  htmlPath: string
  pdfPath: string
  emailPath: string
  checklistPath: string
  qualityJsonPath: string
  qualityMarkdownPath: string
}

export async function guardarSalida(params: {
  nombreCarpeta: string
  validacion: ValidacionPlano
  analisis: AnalisisRFQ
  presupuesto: PresupuestoRFQ
  config: ConfigTaller
  planos?: PlanoEntrada[]
  raw?: Record<string, string>
}): Promise<SalidaGuardada> {
  const directorio = resolve(PILOT_ROOT, 'salidas', `${timestampForPath()}-${sanitize(params.nombreCarpeta)}`)
  await mkdir(directorio, { recursive: true })
  await mkdir(join(directorio, 'raw'), { recursive: true })
  await mkdir(join(directorio, 'input'), { recursive: true })

  const analisisPath = join(directorio, 'analisis.json')
  const presupuestoPath = join(directorio, 'presupuesto.md')
  const htmlPath = join(directorio, 'presupuesto.html')
  const pdfPath = join(directorio, 'presupuesto.pdf')
  const emailPath = join(directorio, 'email-respuesta.md')
  const checklistPath = join(directorio, 'revision-checklist.md')
  const qualityJsonPath = join(directorio, 'quality-report.json')
  const qualityMarkdownPath = join(directorio, 'quality-report.md')
  const quality = evaluarCalidadRFQ({
    validacion: params.validacion,
    analisis: params.analisis,
    presupuesto: params.presupuesto,
  })

  await writeFile(
    analisisPath,
    JSON.stringify(
      {
        validacion: params.validacion,
        analisis: params.analisis,
        presupuesto: params.presupuesto,
      },
      null,
      2
    ),
    'utf8'
  )
  await writeFile(presupuestoPath, params.presupuesto.markdown, 'utf8')
  await writeFile(join(directorio, 'config-taller.json'), JSON.stringify(params.config, null, 2), 'utf8')
  const html = buildPresupuestoHtml(params.presupuesto, params.analisis, params.config)
  await writeHtmlAndPdf(htmlPath, pdfPath, html)
  await writeFile(emailPath, buildEmailRespuesta(params.analisis, params.presupuesto, params.config), 'utf8')
  await writeFile(checklistPath, buildChecklist(params.validacion, params.analisis, params.presupuesto), 'utf8')
  await writeFile(qualityJsonPath, JSON.stringify(quality, null, 2), 'utf8')
  await writeFile(qualityMarkdownPath, buildQualityMarkdown(quality), 'utf8')

  for (const plano of params.planos ?? []) {
    await copyFile(plano.ruta, join(directorio, 'input', plano.nombre)).catch(() => undefined)
  }

  if (params.planos) {
    await writeFile(
      join(directorio, 'input-metadata.json'),
      JSON.stringify(
        {
          planos: params.planos.map((plano) => ({
            nombre: plano.nombre,
            extension: plano.extension,
            mimeType: plano.mimeType,
            esFuentePrincipal: plano.esFuentePrincipal,
            metadata: plano.metadata,
          })),
        },
        null,
        2
      ),
      'utf8'
    )
  }

  for (const [name, value] of Object.entries(params.raw ?? {})) {
    await writeFile(join(directorio, 'raw', `${sanitize(name)}.txt`), value, 'utf8')
  }

  return { directorio, analisisPath, presupuestoPath, htmlPath, pdfPath, emailPath, checklistPath, qualityJsonPath, qualityMarkdownPath }
}

function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function guardarError(params: { nombreCarpeta: string; error: string; raw?: Record<string, string> }): Promise<string> {
  const directorio = resolve(PILOT_ROOT, 'salidas', `${timestampForPath()}-${sanitize(params.nombreCarpeta)}-bloqueado`)
  await mkdir(join(directorio, 'raw'), { recursive: true })
  const generatedAt = new Date().toISOString()
  const quality = {
    version: '1.0',
    ref_interna: sanitize(params.nombreCarpeta) || 'rfq-bloqueado',
    generated_at: generatedAt,
    score_global: 0,
    veredicto: 'NO_PROCESABLE',
    resumen_ejecutivo: 'RFQ bloqueado antes del analisis tecnico. No es seguro generar presupuesto sin corregir el motivo indicado.',
    piezas_total: 0,
    piezas: [],
    grupos: [
      {
        categoria: 'Plano/cajetin',
        severidad_maxima: 'CRITICO',
        total: 1,
        resumen: 'RFQ general con 1 bloqueo critico antes de procesar.',
        issues: [
          {
            categoria: 'Plano/cajetin',
            severidad: 'CRITICO',
            campo: 'Bloqueo inicial',
            mensaje: params.error,
          },
        ],
      },
    ],
    top_issues: [
      {
        categoria: 'Plano/cajetin',
        severidad: 'CRITICO',
        campo: 'Bloqueo inicial',
        mensaje: params.error,
      },
    ],
    preguntas_cliente: [`Corregir el envio o reenviar los planos: ${params.error}`],
    listo_para_envio_cliente: false,
    requiere_revision_humana: true,
  } satisfies QualityReport
  await writeFile(
    join(directorio, 'error.json'),
    JSON.stringify({ estado: 'BLOQUEADO_CON_MOTIVO', error: params.error, timestamp: generatedAt }, null, 2),
    'utf8'
  )
  await writeFile(join(directorio, 'quality-report.json'), JSON.stringify(quality, null, 2), 'utf8')
  await writeFile(join(directorio, 'quality-report.md'), buildQualityMarkdown(quality), 'utf8')
  for (const [name, value] of Object.entries(params.raw ?? {})) {
    await writeFile(join(directorio, 'raw', `${sanitize(name)}.txt`), value, 'utf8')
  }
  return directorio
}

export function buildEmailRespuesta(analisis: AnalisisRFQ, presupuesto: PresupuestoRFQ, config: ConfigTaller): string {
  return `Asunto: [${analisis.ref_interna}] Presupuesto BORRADOR para revision

Hola ${analisis.cliente.contacto},

Adjuntamos presupuesto BORRADOR para revision interna.

Resumen:
- Referencia: ${presupuesto.ref_interna}
- Total IVA incluido: ${presupuesto.total.toFixed(2)} EUR
- Plazo estimado: ${presupuesto.plazo_entrega_dias} dias laborables
- Validez: ${presupuesto.validez_dias} dias

Observaciones:
${presupuesto.observaciones_tecnicas}

Importante: este documento requiere validacion humana antes de envio al cliente final.

Un saludo,
${config.nombre}`
}

function buildChecklist(validacion: ValidacionPlano, analisis: AnalisisRFQ, presupuesto: PresupuestoRFQ): string {
  return `# Checklist de revision humana

Estado sugerido: ${validacion.resultado === 'NO_PROCESABLE' ? 'BLOQUEADO_CON_MOTIVO' : 'REVISAR'}

- [ ] Plano legible y version correcta
- [ ] Material confirmado
- [ ] Cantidades confirmadas
- [ ] Tolerancias criticas revisadas
- [ ] Operaciones de fabricacion razonables
- [ ] Tiempo estimado validado
- [ ] Costes y margenes revisados
- [ ] Plazo de entrega revisado
- [ ] Documento mantiene marca BORRADOR
- [ ] Email revisado antes de enviar

## Confianza IA

- Validacion: ${validacion.confidence_score}
- Analisis: ${analisis.confidence_score}
- Presupuesto: ${presupuesto.confidence_score}

## Bloqueos / puntos a revisar

${[...validacion.blocking_reasons, ...analisis.blocking_reasons, ...presupuesto.blocking_reasons].map((item) => `- ${item}`).join('\n') || '- Sin bloqueos declarados'}

## Auditoria tecnica por pieza

${analisis.piezas
  .map(
    (pieza, index) => `### ${index + 1}. ${pieza.denominacion}

- Plano: ${pieza.numero_plano}${pieza.revision_plano ? ` | Rev: ${pieza.revision_plano}` : ''}
- Archivo/pagina: ${pieza.archivo_origen ?? 'No especificado'}${pieza.pagina_pdf ? ` pag. ${pieza.pagina_pdf}` : ''}
- Material: ${pieza.material}
- Fuente material: ${pieza.material_fuente || 'Sin fuente declarada'}
- Cantidad fuente: ${pieza.cantidad_fuente || 'Sin fuente declarada'}
- Dimensiones: ${pieza.dimensiones}
- Fuente dimensiones: ${pieza.dimensiones_fuente || 'Sin fuente declarada'}
- Tolerancias generales: ${pieza.tolerancias_generales}
- Fuente tolerancias: ${pieza.tolerancias_fuente || 'Sin fuente declarada'}
- Acabado: ${pieza.acabado}
- Fuente acabado: ${pieza.acabado_fuente || 'Sin fuente declarada'}
- Cajetin leido: ${pieza.cajetin_texto || 'No especificado'}
- Zonas revisadas: ${pieza.zonas_revisadas.join(', ') || 'No declaradas'}
- Campos no encontrados: ${pieza.campos_no_encontrados.join(', ') || 'Ninguno declarado'}
- Roscas: ${pieza.roscas.join(', ') || 'Ninguna declarada'}
- Agujeros: ${pieza.agujeros.join(', ') || 'Ninguno declarado'}
- Ajustes: ${pieza.ajustes.join(', ') || 'Ninguno declarado'}
- Rugosidades: ${pieza.rugosidades.join(', ') || 'Ninguna declarada'}
- Notas: ${pieza.notas_plano.join('; ') || 'Sin notas declaradas'}
`
  )
  .join('\n')}
`
}
