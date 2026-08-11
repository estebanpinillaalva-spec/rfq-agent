import { mkdir, readdir, readFile, stat, writeFile, access } from 'fs/promises'
import { basename, join, resolve } from 'path'

export type RfqStatus = 'COMPLETADO' | 'BLOQUEADO_CON_MOTIVO' | 'ERROR_RECUPERABLE' | 'REVISAR' | 'PROCESANDO'

export interface LocalRfqSummary {
  id: string
  status: RfqStatus
  createdAt: string
  cliente: string
  refInterna: string
  rfqLabel: string
  emailFrom: string
  emailSubject: string
  receivedAtLabel: string
  total: number | null
  complejidad: string
  hasPdf: boolean
  hasEmail: boolean
  qualityScore: number | null
  qualityVerdict: string | null
  qualityIssueCount: number
  processMessage: string | null
  processProvider: string | null
  path: string
}

export interface LocalRfqDetail extends LocalRfqSummary {
  analysisJson: unknown | null
  presupuestoMd: string
  emailMd: string
  checklistMd: string
  error: string | null
  planos: LocalPlano[]
  extracciones: PlanoExtractionSummary[]
  completitud: CompletenessCheck[]
  quality: LocalQualityReport | null
  presupuestoLineas: LocalBudgetLine[]
}

export interface LocalPlano {
  name: string
  href: string
  kind: 'image' | 'pdf' | 'cad' | 'other'
}

export interface PlanoExtractionSummary {
  index: number
  pieza: string
  numeroPlano: string
  archivoOrigen: string
  paginaPdf: number | null
  trazabilidadConfianza: string
  revisionPlano: string
  escala: string
  cajetinTexto: string
  materialFuente: string | null
  cantidadFuente: string | null
  dimensionesFuente: string | null
  toleranciasFuente: string | null
  acabadoFuente: string | null
  revisionFuente: string | null
  material: string
  dimensiones: string
  toleranciasGenerales: string
  toleranciasCriticas: string[]
  gdt: string[]
  acabado: string
  tratamientos: string[]
  recubrimientos: string[]
  roscas: string[]
  agujeros: string[]
  ajustes: string[]
  chaflanesRadios: string[]
  rugosidades: string[]
  notasPlano: string[]
  zonasRevisadas: string[]
  camposNoEncontrados: string[]
  operaciones: string[]
  caracteristicasCriticas: string[]
  riesgos: string[]
  ambiguedades: string[]
  cantidad: number | null
  plazo: string
  confidence: number | null
}

export interface CompletenessCheck {
  label: string
  ok: boolean
  detail: string
  detalles?: string[]
}

export interface LocalQualityIssue {
  categoria: string
  severidad: string
  pieza?: string
  campo: string
  mensaje: string
}

export interface LocalQualityGroup {
  categoria: string
  severidad_maxima: string
  total: number
  resumen: string
  issues: LocalQualityIssue[]
}

export interface LocalQualityPiece {
  pieza: string
  score: number
  veredicto: string
  issues: LocalQualityIssue[]
}

export interface LocalQualityReport {
  score_global: number
  veredicto: string
  resumen_ejecutivo: string
  piezas_total: number
  piezas: LocalQualityPiece[]
  grupos: LocalQualityGroup[]
  top_issues: LocalQualityIssue[]
  preguntas_cliente: string[]
  listo_para_envio_cliente: boolean
  requiere_revision_humana: boolean
}

export interface LocalBudgetBreakdown {
  coste_material: number
  coste_operaciones: number
  coste_setup: number
  coste_subcontratas: number
  overhead: number
  margen: number
  coste_material_total: number | null
  peso_estimado_kg: number | null
  precio_material_eur_kg: number | null
  desperdicio_pct: number | null
  estado_material: string
  fuente_tiempo: string | null
  material_normalizado: string
  material_confianza: string
  avisos_material: string[]
  riesgo_pct: number | null
}

export interface LocalBudgetLine {
  denominacion: string
  cantidad: number
  pvp_unitario: number
  subtotal: number
  operaciones: string
  plazo_dias: number
  desglose: LocalBudgetBreakdown | null
}

export interface PipelineRow {
  [key: string]: string
}

export const repoRoot = process.cwd()
export const pilotRoot = join(repoRoot, 'rfq-agent-piloto')
export const salidasRoot = join(pilotRoot, 'salidas')
export const inboxRoot = join(pilotRoot, 'inbox')
export const pipelinePath = join(repoRoot, 'prospectos', 'pipeline.csv')
const dashboardViewPath = join(pilotRoot, '.dashboard-view.json')

export async function listRfqs(options: { includeHidden?: boolean } = {}): Promise<LocalRfqSummary[]> {
  const entries = await readdir(salidasRoot, { withFileTypes: true }).catch(() => [])
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  const hiddenIds = options.includeHidden ? new Set<string>() : await readHiddenRfqIds()
  const [summaries, pending] = await Promise.all([
    Promise.all(dirs.map((id) => readRfqSummary(id))),
    readPendingInboxSummaries(dirs),
  ])
  return [...summaries, ...pending]
    .filter((summary): summary is LocalRfqSummary => summary !== null)
    .filter((summary) => !hiddenIds.has(summary.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function hideRfqIds(ids: string[]): Promise<number> {
  const current = await readHiddenRfqIds()
  ids.forEach((id) => current.add(basename(id)))
  await writeDashboardView(current)
  return current.size
}

export async function clearHiddenRfqIds(): Promise<void> {
  await writeDashboardView(new Set())
}

export async function getRfqDetail(id: string): Promise<LocalRfqDetail | null> {
  const summary = await readRfqSummary(id)
  if (!summary) return null
  const dir = safeSalidaDir(id)
  const [analysisJson, presupuestoMd, emailMd, checklistMd, errorJson, qualityJson] = await Promise.all([
    readJsonSafe(join(dir, 'analisis.json')),
    readTextSafe(join(dir, 'presupuesto.md')),
    readTextSafe(join(dir, 'email-respuesta.md')),
    readTextSafe(join(dir, 'revision-checklist.md')),
    readJsonSafe(join(dir, 'error.json')),
    readJsonSafe(join(dir, 'quality-report.json')),
  ])
  const planos = await listPlanos(id)
  const extracciones = buildExtractionSummaries(analysisJson)

  return {
    ...summary,
    analysisJson,
    presupuestoMd,
    emailMd,
    checklistMd,
    error: getErrorMessage(errorJson),
    planos,
    extracciones,
    completitud: buildCompleteness(extracciones, analysisJson),
    quality: normalizeQualityReport(qualityJson),
    presupuestoLineas: buildBudgetLines(analysisJson),
  }
}

export async function readPipeline(): Promise<{ headers: string[]; rows: PipelineRow[] }> {
  const text = await readTextSafe(pipelinePath)
  if (!text.trim()) return { headers: [], rows: [] }
  const records = parseCsv(text)
  const headers = records[0] ?? []
  const rows = records.slice(1).map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? '']))
  )
  return { headers, rows }
}

export async function updatePipelineRow(index: number, patch: PipelineRow): Promise<void> {
  const { headers, rows } = await readPipeline()
  if (!rows[index]) throw new Error('Prospecto no encontrado')
  rows[index] = { ...rows[index], ...patch }
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))]
    .map((record) => record.map(escapeCsv).join(','))
    .join('\n')
  await writeFile(pipelinePath, `${csv}\n`, 'utf8')
}

export async function appendPipelineRow(row: PipelineRow): Promise<void> {
  const { headers, rows } = await readPipeline()
  rows.push(row)
  const csv = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))]
    .map((record) => record.map(escapeCsv).join(','))
    .join('\n')
  await writeFile(pipelinePath, `${csv}\n`, 'utf8')
}

// Crea una entrada de pipeline desde un RFQ completado. Usa inboxId como clave de deduplicación.
export async function appendPipelineRowFromRfq(inboxId: string): Promise<void> {
  const dedupeTag = `[RFQ:${inboxId}]`
  const { rows } = await readPipeline()
  if (rows.some((r) => (r.observaciones ?? '').includes(dedupeTag))) return

  const entries = await readdir(salidasRoot, { withFileTypes: true }).catch(() => [])
  const salidaEntry = entries.find(
    (e) => e.isDirectory() && e.name.toLowerCase().includes(inboxId.toLowerCase()) && !e.name.endsWith('-bloqueado')
  )
  if (!salidaEntry) return

  const dir = join(salidasRoot, salidaEntry.name)
  const analysis = await readJsonSafe(join(dir, 'analisis.json'))
  const combined = asRecord(analysis)
  const analisis = asRecord(combined?.analisis)
  const presupuesto = asRecord(combined?.presupuesto)
  const cliente = asRecord(analisis?.cliente)

  const row: PipelineRow = {
    empresa: typeof cliente?.empresa === 'string' ? cliente.empresa : '',
    contacto: typeof cliente?.contacto === 'string' ? cliente.contacto : '',
    email: typeof cliente?.email === 'string' ? cliente.email : '',
    canal_contacto: 'Email RFQ',
    fecha_contacto_1: new Date().toISOString().slice(0, 10),
    estado: 'Oferta borrador',
    proxima_accion: 'Revisar y enviar presupuesto',
    ticket_estimado: numberOrNull(presupuesto?.total) !== null ? String(numberOrNull(presupuesto?.total)) : '',
    observaciones: `${dedupeTag} Generado automaticamente desde email entrante`,
  }

  await appendPipelineRow(row)
}

export function safeSalidaDir(id: string): string {
  const clean = basename(id)
  const dir = resolve(salidasRoot, clean)
  if (!dir.startsWith(resolve(salidasRoot))) throw new Error('Ruta de salida no permitida')
  return dir
}

async function readRfqSummary(id: string): Promise<LocalRfqSummary | null> {
  const dir = safeSalidaDir(id)
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) return null

  const analysis = await readJsonSafe(join(dir, 'analisis.json'))
  const error = await readJsonSafe(join(dir, 'error.json'))
  const quality = normalizeQualityReport(await readJsonSafe(join(dir, 'quality-report.json')))
  const sourceEmailText = (await readTextSafe(join(dir, 'raw', 'email.txt'))) || (await readLinkedInboxEmail(id))
  const combined = asRecord(analysis)
  const analisis = asRecord(combined?.analisis)
  const presupuesto = asRecord(combined?.presupuesto)
  const cliente = asRecord(analisis?.cliente)
  const emailFromRaw = extractEmailValue(sourceEmailText, 'De')
  const clienteEmailFallback = typeof cliente?.email === 'string' ? cliente.email : ''
  const emailFrom = emailFromRaw || clienteEmailFallback
  const emailSubject = extractEmailValue(sourceEmailText, 'Asunto')
  const emailDate = extractEmailValue(sourceEmailText, 'Fecha')

  const createdAt = info.mtime.toISOString()
  const pdfPath = join(dir, 'presupuesto.pdf')
  const emailPath = join(dir, 'email-respuesta.md')
  const hasPdf = await access(pdfPath).then(() => true).catch(() => false)
  const hasEmail = await access(emailPath).then(() => true).catch(() => false)

  const status: RfqStatus = error
    ? 'BLOQUEADO_CON_MOTIVO'
    : analysis && hasPdf && hasEmail
      ? 'COMPLETADO'
      : 'REVISAR'

  return {
    id,
    status,
    createdAt,
    cliente: stringOr(cliente?.empresa, emailFrom || 'Sin cliente'),
    refInterna: buildRfqLabel({
      createdAt: emailDate || createdAt,
      subject: emailSubject,
      from: emailFrom,
      fallback: stringOr(analisis?.ref_interna ?? presupuesto?.ref_interna, id),
    }),
    rfqLabel: buildRfqLabel({
      createdAt: emailDate || createdAt,
      subject: emailSubject,
      from: emailFrom,
      fallback: stringOr(analisis?.ref_interna ?? presupuesto?.ref_interna, id),
    }),
    emailFrom,
    emailSubject,
    receivedAtLabel: formatDateTimeLabel(emailDate || createdAt),
    total: numberOrNull(presupuesto?.total),
    complejidad: stringOr(analisis?.complejidad_global, 'N/D'),
    hasPdf,
    hasEmail,
    qualityScore: quality?.score_global ?? null,
    qualityVerdict: quality?.veredicto ?? null,
    qualityIssueCount: quality?.grupos.reduce((sum, group) => sum + group.total, 0) ?? 0,
    processMessage: null,
    processProvider: null,
    path: dir,
  }
}

async function readPendingInboxSummaries(salidaIds: string[]): Promise<LocalRfqSummary[]> {
  const entries = await readdir(inboxRoot, { withFileTypes: true }).catch(() => [])
  const inboxIds = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  const pending = await Promise.all(
    inboxIds
      .filter((id) => !salidaIds.some((salidaId) => salidaId.includes(id)))
      .map((id) => readPendingInboxSummary(id))
  )
  return pending.filter((summary): summary is LocalRfqSummary => summary !== null)
}

async function readPendingInboxSummary(id: string): Promise<LocalRfqSummary | null> {
  const dir = resolve(inboxRoot, basename(id))
  if (!dir.startsWith(resolve(inboxRoot))) return null
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) return null

  const [emailText, statusJson] = await Promise.all([
    readTextSafe(join(dir, 'email.txt')),
    readJsonSafe(join(dir, 'process-status.json')),
  ])
  const status = asRecord(statusJson)
  const rawStatus = stringOr(status?.status, 'PROCESANDO')
  const isBlocked = rawStatus === 'BLOQUEADO_SIN_ADJUNTOS'
  const missingStatusIsStale = !status && Date.now() - info.mtime.getTime() > 20 * 60 * 1000
  const isError = rawStatus === 'ERROR' || missingStatusIsStale

  const emailFrom = extractEmailValue(emailText, 'De')
  const emailSubject = extractEmailValue(emailText, 'Asunto')
  const emailDate = extractEmailValue(emailText, 'Fecha')
  const displayDate = emailDate || info.mtime.toISOString()

  return {
    id,
    status: isBlocked ? 'BLOQUEADO_CON_MOTIVO' : isError ? 'ERROR_RECUPERABLE' : 'PROCESANDO',
    createdAt: info.mtime.toISOString(),
    cliente: emailFrom || 'Email recibido',
    refInterna: buildRfqLabel({ createdAt: displayDate, subject: emailSubject, from: emailFrom, fallback: id }),
    rfqLabel: buildRfqLabel({ createdAt: displayDate, subject: emailSubject, from: emailFrom, fallback: id }),
    emailFrom,
    emailSubject,
    receivedAtLabel: formatDateTimeLabel(displayDate),
    total: null,
    complejidad: isBlocked ? 'Sin adjuntos' : isError ? 'Error recuperable' : 'Procesando',
    hasPdf: false,
    hasEmail: false,
    qualityScore: null,
    qualityVerdict: null,
    qualityIssueCount: 0,
    processMessage: stringOr(status?.message, isError ? 'El proceso no termino correctamente.' : 'Proceso pendiente o en curso.'),
    processProvider: typeof status?.provider === 'string' ? status.provider : null,
    path: dir,
  }
}

async function readTextSafe(path: string): Promise<string> {
  return readFile(path, 'utf8').catch(() => '')
}

async function readHiddenRfqIds(): Promise<Set<string>> {
  const data = asRecord(await readJsonSafe(dashboardViewPath))
  const ids = Array.isArray(data?.hidden_ids) ? data.hidden_ids.filter((id): id is string => typeof id === 'string') : []
  return new Set(ids.map((id) => basename(id)))
}

async function writeDashboardView(hiddenIds: Set<string>): Promise<void> {
  await mkdir(pilotRoot, { recursive: true })
  await writeFile(
    dashboardViewPath,
    `${JSON.stringify({ version: 1, hidden_ids: Array.from(hiddenIds).sort(), updated_at: new Date().toISOString() }, null, 2)}\n`,
    'utf8'
  )
}

async function readJsonSafe(path: string): Promise<unknown | null> {
  const text = await readTextSafe(path)
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function readLinkedInboxEmail(salidaId: string): Promise<string> {
  const entries = await readdir(inboxRoot, { withFileTypes: true }).catch(() => [])
  const match = entries.find((entry) => entry.isDirectory() && salidaId.includes(entry.name))
  return match ? readTextSafe(join(inboxRoot, match.name, 'email.txt')) : ''
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

// La UI necesita distinguir "el modelo no declaro fuente" de "el campo no
// esta en el plano"; un texto de relleno aqui borraria esa diferencia.
function textoONull(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function getErrorMessage(value: unknown): string | null {
  const record = asRecord(value)
  return typeof record?.error === 'string' ? record.error : null
}

function normalizeQualityReport(value: unknown): LocalQualityReport | null {
  const report = asRecord(value)
  if (!report) return null
  const grupos = arrayRecords(report.grupos).map((group) => ({
    categoria: stringOr(group.categoria, 'General'),
    severidad_maxima: stringOr(group.severidad_maxima, 'INFO'),
    total: numberOrNull(group.total) ?? 0,
    resumen: stringOr(group.resumen, ''),
    issues: arrayRecords(group.issues).map(normalizeQualityIssue),
  }))
  return {
    score_global: numberOrNull(report.score_global) ?? 0,
    veredicto: stringOr(report.veredicto, 'ACLARACIONES_NECESARIAS'),
    resumen_ejecutivo: stringOr(report.resumen_ejecutivo, ''),
    piezas_total: numberOrNull(report.piezas_total) ?? 0,
    piezas: arrayRecords(report.piezas).map((piece) => ({
      pieza: stringOr(piece.pieza, 'Pieza'),
      score: numberOrNull(piece.score) ?? 0,
      veredicto: stringOr(piece.veredicto, 'ACLARACIONES_NECESARIAS'),
      issues: arrayRecords(piece.issues).map(normalizeQualityIssue),
    })),
    grupos,
    top_issues: arrayRecords(report.top_issues).map(normalizeQualityIssue),
    preguntas_cliente: stringArray(report.preguntas_cliente),
    listo_para_envio_cliente: report.listo_para_envio_cliente === true,
    requiere_revision_humana: report.requiere_revision_humana !== false,
  }
}

function normalizeQualityIssue(issue: Record<string, unknown>): LocalQualityIssue {
  return {
    categoria: stringOr(issue.categoria, 'General'),
    severidad: stringOr(issue.severidad, 'INFO'),
    pieza: typeof issue.pieza === 'string' ? issue.pieza : undefined,
    campo: stringOr(issue.campo, 'Campo'),
    mensaje: stringOr(issue.mensaje, ''),
  }
}

function buildBudgetLines(value: unknown): LocalBudgetLine[] {
  const root = asRecord(value)
  const presupuesto = asRecord(root?.presupuesto)
  return arrayRecords(presupuesto?.lineas).map((linea) => {
    const desglose = asRecord(linea.desglose)
    return {
      denominacion: stringOr(linea.denominacion, 'Pieza'),
      cantidad: numberOrNull(linea.cantidad) ?? 0,
      pvp_unitario: numberOrNull(linea.pvp_unitario) ?? 0,
      subtotal: numberOrNull(linea.subtotal) ?? 0,
      operaciones: stringOr(linea.operaciones, ''),
      plazo_dias: numberOrNull(linea.plazo_dias) ?? 0,
      desglose: desglose
        ? {
            coste_material: numberOrNull(desglose.coste_material) ?? 0,
            coste_operaciones: numberOrNull(desglose.coste_operaciones) ?? 0,
            coste_setup: numberOrNull(desglose.coste_setup) ?? 0,
            coste_subcontratas: numberOrNull(desglose.coste_subcontratas) ?? 0,
            overhead: numberOrNull(desglose.overhead) ?? 0,
            margen: numberOrNull(desglose.margen) ?? 0,
            coste_material_total: numberOrNull(desglose.coste_material_total),
            peso_estimado_kg: numberOrNull(desglose.peso_estimado_kg),
            precio_material_eur_kg: numberOrNull(desglose.precio_material_eur_kg),
            desperdicio_pct: numberOrNull(desglose.desperdicio_pct),
            estado_material: stringOr(desglose.estado_material, 'requiere_revision'),
            fuente_tiempo: textoONull(desglose.fuente_tiempo),
            material_normalizado: stringOr(desglose.material_normalizado, 'No especificado'),
            material_confianza: stringOr(desglose.material_confianza, 'N/D'),
            avisos_material: stringArray(desglose.avisos_material),
            riesgo_pct: numberOrNull(desglose.riesgo_pct),
          }
        : null,
    }
  })
}

function arrayRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord).filter((item): item is Record<string, unknown> => item !== null) : []
}

async function listPlanos(id: string): Promise<LocalPlano[]> {
  const dir = join(safeSalidaDir(id), 'input')
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const ext = entry.name.split('.').pop()?.toLowerCase() ?? ''
      const kind: LocalPlano['kind'] = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
        ? 'image'
        : ext === 'pdf'
          ? 'pdf'
          : ['step', 'stp', 'dxf'].includes(ext)
            ? 'cad'
            : 'other'
      return {
        name: entry.name,
        href: `/api/local/rfqs/${id}/input-file?name=${encodeURIComponent(entry.name)}`,
        kind,
      }
    })
}

function buildExtractionSummaries(value: unknown): PlanoExtractionSummary[] {
  const root = asRecord(value)
  const analisis = asRecord(root?.analisis)
  const piezas = Array.isArray(analisis?.piezas) ? analisis.piezas : []
  if (!analisis || piezas.length === 0) return []
  const cantidades = asRecord(analisis.cantidades)

  return piezas
    .map((item, index) => ({ pieza: asRecord(item), index }))
    .filter((item): item is { pieza: Record<string, unknown>; index: number } => item.pieza !== null)
    .map(({ pieza, index }) => {
      const piezaNombre = stringOr(pieza.denominacion, `Pieza ${index + 1}`)
      return {
        index,
        pieza: piezaNombre,
        numeroPlano: stringOr(pieza.numero_plano, 'No especificado'),
        archivoOrigen: stringOr(pieza.archivo_origen, 'No especificado'),
        paginaPdf: numberOrNull(pieza.pagina_pdf),
        trazabilidadConfianza: stringOr(pieza.trazabilidad_confianza, 'Sin trazabilidad declarada'),
        revisionPlano: stringOr(pieza.revision_plano, 'No especificado'),
        escala: stringOr(pieza.escala, 'No especificado'),
        cajetinTexto: stringOr(pieza.cajetin_texto, 'No especificado'),
        materialFuente: textoONull(pieza.material_fuente),
        cantidadFuente: textoONull(pieza.cantidad_fuente),
        dimensionesFuente: textoONull(pieza.dimensiones_fuente),
        toleranciasFuente: textoONull(pieza.tolerancias_fuente),
        acabadoFuente: textoONull(pieza.acabado_fuente),
        revisionFuente: textoONull(pieza.revision_fuente),
        material: stringOr(pieza.material, 'No especificado'),
        dimensiones: stringOr(pieza.dimensiones, 'No especificado'),
        toleranciasGenerales: stringOr(pieza.tolerancias_generales, 'No especificado'),
        toleranciasCriticas: stringArray(pieza.tolerancias_criticas),
        gdt: stringArray(pieza.gdt),
        acabado: stringOr(pieza.acabado, 'No especificado'),
        tratamientos: stringArray(pieza.tratamientos),
        recubrimientos: stringArray(pieza.recubrimientos),
        roscas: stringArray(pieza.roscas),
        agujeros: stringArray(pieza.agujeros),
        ajustes: stringArray(pieza.ajustes),
        chaflanesRadios: stringArray(pieza.chaflanes_radios),
        rugosidades: stringArray(pieza.rugosidades),
        notasPlano: stringArray(pieza.notas_plano),
        zonasRevisadas: stringArray(pieza.zonas_revisadas),
        camposNoEncontrados: stringArray(pieza.campos_no_encontrados),
        operaciones: stringArray(pieza.operaciones),
        caracteristicasCriticas: stringArray(pieza.caracteristicas_criticas),
        riesgos: stringArray(asRecord(analisis.dfm)?.riesgos),
        ambiguedades: [...stringArray(asRecord(analisis.dfm)?.ambiguedades), ...stringArray(pieza.flags)],
        cantidad: getCantidad(cantidades, piezaNombre),
        plazo: stringOr(analisis.plazo_solicitado, 'No especificado'),
        confidence: numberOrNull(analisis.confidence_score),
      }
    })
}

function buildCompleteness(summaries: PlanoExtractionSummary[], value: unknown): CompletenessCheck[] {
  if (summaries.length === 0) return [{ label: 'Extraccion', ok: false, detail: 'No hay analisis tecnico estructurado.' }]
  const root = asRecord(value)
  const analisis = asRecord(root?.analisis)
  const presupuesto = asRecord(root?.presupuesto)
  const blockingReasons = Array.from(new Set(
    [...stringArray(analisis?.blocking_reasons), ...stringArray(presupuesto?.blocking_reasons)]
      .map((reason) => reason.trim())
      .filter(Boolean),
  ))
  const missingTrace = summaries.filter((summary) => summary.archivoOrigen === 'No especificado').map((summary) => summary.pieza)
  const missingMaterial = summaries.filter((summary) => /no especificado/i.test(summary.material)).map((summary) => summary.pieza)
  const missingMaterialSource = summaries
    .filter((summary) => summary.materialFuente === null || /sin fuente|no especificado/i.test(summary.materialFuente))
    .map((summary) => summary.pieza)
  const missingQuantity = summaries.filter((summary) => !summary.cantidad || summary.cantidad <= 0).map((summary) => summary.pieza)
  const weakDimensions = summaries
    .filter((summary) => /no especificado|ver plano|aprox/i.test(summary.dimensiones))
    .map((summary) => summary.pieza)
  const weakTolerances = summaries
    .filter((summary) => summary.toleranciasCriticas.length === 0 && /no especificado/i.test(summary.toleranciasGenerales))
    .map((summary) => summary.pieza)
  const missingFinish = summaries.filter((summary) => /no especificado/i.test(summary.acabado)).map((summary) => summary.pieza)
  const weakOperations = summaries.filter((summary) => summary.operaciones.length < 3).map((summary) => summary.pieza)

  return [
    { label: 'Piezas detectadas', ok: summaries.length > 0, detail: `${summaries.length} pieza(s) en el RFQ` },
    { label: 'Trazabilidad plano/pagina', ok: missingTrace.length === 0, detail: missingTrace.length ? `Falta en: ${missingTrace.join(', ')}` : 'Todas las piezas tienen archivo origen' },
    { label: 'Material', ok: missingMaterial.length === 0, detail: missingMaterial.length ? `Falta en: ${missingMaterial.join(', ')}` : 'Material indicado en todas las piezas' },
    { label: 'Fuente del material', ok: missingMaterialSource.length === 0, detail: missingMaterialSource.length ? `Sin evidencia en: ${missingMaterialSource.join(', ')}` : 'Cada material tiene fuente declarada' },
    { label: 'Cantidad', ok: missingQuantity.length === 0, detail: missingQuantity.length ? `Falta en: ${missingQuantity.join(', ')}` : 'Cantidad detectada en todas las piezas' },
    { label: 'Dimensiones generales', ok: weakDimensions.length === 0, detail: weakDimensions.length ? `Revisar: ${weakDimensions.join(', ')}` : 'Dimensiones suficientes para revision' },
    { label: 'Tolerancias', ok: weakTolerances.length === 0, detail: weakTolerances.length ? `Faltan en: ${weakTolerances.join(', ')}` : 'Tolerancias detectadas o asumidas' },
    { label: 'Acabado/tratamientos', ok: missingFinish.length === 0, detail: missingFinish.length ? `Falta en: ${missingFinish.join(', ')}` : 'Acabado/tratamiento informado' },
    { label: 'Operaciones', ok: weakOperations.length === 0, detail: weakOperations.length ? `Incompletas en: ${weakOperations.join(', ')}` : 'Ruta de fabricacion definida' },
    {
      label: 'Ambiguedades bloqueantes',
      ok: blockingReasons.length === 0,
      detail: blockingReasons.length > 0 ? `${blockingReasons.length} motivo(s) bloqueante(s)` : 'Sin bloqueos',
      detalles: blockingReasons,
    },
  ]
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function extractEmailValue(text: string, label: string): string {
  const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))
  return match?.[1]?.trim() ?? ''
}

function buildRfqLabel(params: { createdAt: string; subject: string; from: string; fallback: string }): string {
  const date = formatDateSlug(params.createdAt)
  const subject = compactLabel(params.subject)
  const from = compactLabel(extractEmailAddress(params.from) || params.from)
  const parts = [date, subject, from].filter(Boolean)
  return parts.length >= 2 ? parts.join(' | ') : params.fallback
}

function formatDateSlug(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function compactLabel(value: string): string {
  return value
    .replace(/[<>"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70)
}

function extractEmailAddress(value: string): string {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
}

function getCantidad(cantidades: Record<string, unknown> | null, piezaNombre: string): number | null {
  const exact = numberOrNull(cantidades?.[piezaNombre])
  if (exact !== null) return exact
  const normalizedName = normalizeKey(piezaNombre)
  const fuzzy = Object.entries(cantidades ?? {}).find(([key]) => normalizeKey(key) === normalizedName)
  if (fuzzy) return numberOrNull(fuzzy[1])
  const values = Object.values(cantidades ?? {}).filter((value): value is number => typeof value === 'number')
  return values.length === 1 ? values[0] : null
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (quoted && char === '"' && next === '"') {
      cell += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell)
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  row.push(cell)
  if (row.some((value) => value.length > 0)) rows.push(row)
  return rows
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}
