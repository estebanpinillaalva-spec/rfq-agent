import type {
  AnalisisRFQ,
  PresupuestoRFQ,
  QualityCategory,
  QualityGroup,
  QualityIssue,
  QualityPieceScore,
  QualityReport,
  QualitySeverity,
  QualityVerdict,
  ValidacionPlano,
} from '../types'
import { normalize } from './normalize'

const categories: QualityCategory[] = ['Datos comerciales', 'Plano/cajetin', 'Fabricacion', 'Riesgos DFM', 'Coste/plazo']

export function evaluarCalidadRFQ(params: {
  validacion: ValidacionPlano
  analisis: AnalisisRFQ
  presupuesto: PresupuestoRFQ
}): QualityReport {
  const globalIssues: QualityIssue[] = []
  addDeclaredBlockingIssues(globalIssues, params, params.validacion.blocking_reasons)
  addDeclaredBlockingIssues(globalIssues, params, params.analisis.blocking_reasons)
  addDeclaredBlockingIssues(globalIssues, params, params.presupuesto.blocking_reasons)

  if (params.validacion.resultado === 'NO_PROCESABLE') {
    globalIssues.push({
      categoria: 'Plano/cajetin',
      severidad: 'CRITICO',
      campo: 'Validacion',
      mensaje: 'La validacion marco el RFQ como no procesable.',
    })
  }

  if (/no especificado/i.test(params.analisis.plazo_solicitado)) {
    globalIssues.push({
      categoria: 'Coste/plazo',
      severidad: 'AVISO',
      campo: 'Plazo',
      mensaje: 'El plazo solicitado no esta especificado.',
    })
  }

  if (params.presupuesto.lineas.some((linea) => linea.desglose?.fuente_tiempo === 'estimacion_modelo')) {
    globalIssues.push({
      categoria: 'Coste/plazo',
      severidad: 'AVISO',
      campo: 'fuente_tiempo',
      mensaje: 'Los tiempos de operacion son estimacion del modelo, sin validar contra la tabla del taller',
    })
  }

  const piezas = params.analisis.piezas.map((pieza): QualityPieceScore => {
    const issues: QualityIssue[] = []
    addIf(issues, isMissing(pieza.material), 'Plano/cajetin', 'CRITICO', pieza.denominacion, 'Material', 'Falta material claro para cotizar con seguridad.')
    addIf(
      issues,
      /sin fuente|no especificado/i.test(pieza.material_fuente),
      'Plano/cajetin',
      'AVISO',
      pieza.denominacion,
      'Fuente material',
      'El material no tiene evidencia clara de cajetin, nota o email.'
    )
    addIf(
      issues,
      !hasQuantity(params.analisis.cantidades, pieza.denominacion, params.analisis.piezas.length),
      'Datos comerciales',
      'CRITICO',
      pieza.denominacion,
      'Cantidad',
      'No hay cantidad fiable asociada a la pieza.'
    )
    addIf(
      issues,
      hasQuantity(params.analisis.cantidades, pieza.denominacion, params.analisis.piezas.length) && isInferredQuantity(pieza.cantidad_fuente),
      'Datos comerciales',
      'AVISO',
      pieza.denominacion,
      'Cantidad',
      'La cantidad se ha inferido; confirmar unidades antes de enviar precio final.'
    )
    addIf(issues, isMissing(pieza.numero_plano), 'Plano/cajetin', 'AVISO', pieza.denominacion, 'Numero de plano', 'Falta numero o referencia de plano.')
    addIf(issues, isMissing(pieza.dimensiones), 'Fabricacion', 'CRITICO', pieza.denominacion, 'Dimensiones', 'Faltan dimensiones principales.')
    addIf(
      issues,
      pieza.tolerancias_criticas.length === 0 && isMissing(pieza.tolerancias_generales),
      'Fabricacion',
      'AVISO',
      pieza.denominacion,
      'Tolerancias',
      'No hay tolerancias criticas ni norma general clara.'
    )
    addIf(issues, isMissing(pieza.acabado), 'Fabricacion', 'AVISO', pieza.denominacion, 'Acabado', 'Acabado/tratamiento no especificado.')
    addIf(issues, pieza.operaciones.length < 3, 'Fabricacion', 'AVISO', pieza.denominacion, 'Operaciones', 'Ruta de fabricacion poco definida.')
    addIf(
      issues,
      pieza.campos_no_encontrados.length > 4,
      'Plano/cajetin',
      'AVISO',
      pieza.denominacion,
      'Campos no encontrados',
      `Hay ${pieza.campos_no_encontrados.length} campos tecnicos sin localizar.`
    )
    for (const flag of pieza.flags.filter((item) => !/BORRADOR/i.test(item)).slice(0, 4)) {
      issues.push({ categoria: 'Riesgos DFM', severidad: 'AVISO', pieza: pieza.denominacion, campo: 'Flag tecnico', mensaje: flag })
    }

    const score = scoreFromIssues(issues)
    return { pieza: pieza.denominacion, score, veredicto: verdictFromScore(score, issues), issues }
  })

  for (const riesgo of params.analisis.dfm.riesgos.slice(0, 8)) {
    globalIssues.push({ categoria: 'Riesgos DFM', severidad: 'AVISO', campo: 'Riesgo DFM', mensaje: riesgo })
  }
  for (const ambiguedad of params.analisis.dfm.ambiguedades.slice(0, 8)) {
    globalIssues.push({ categoria: 'Riesgos DFM', severidad: 'AVISO', campo: 'Ambiguedad', mensaje: ambiguedad })
  }

  const allIssues = uniqueIssues([...globalIssues, ...piezas.flatMap((pieza) => pieza.issues)])
  const scorePiezas = piezas.length ? average(piezas.map((pieza) => pieza.score)) : 0
  const scoreGlobal = Math.max(0, Math.min(100, Math.round(scorePiezas - globalPenalty(globalIssues))))
  const veredicto = verdictFromScore(scoreGlobal, allIssues)
  const grupos = groupIssues(allIssues)
  const topIssues = [...allIssues].sort(compareSeverity).slice(0, 5)

  return {
    version: '1.0',
    ref_interna: params.analisis.ref_interna,
    generated_at: new Date().toISOString(),
    score_global: scoreGlobal,
    veredicto,
    resumen_ejecutivo: buildExecutiveSummary(veredicto, scoreGlobal, allIssues.length),
    piezas_total: piezas.length,
    piezas,
    grupos,
    top_issues: topIssues,
    preguntas_cliente: buildQuestions(allIssues),
    listo_para_envio_cliente: false,
    requiere_revision_humana: true,
  }
}

function addDeclaredBlockingIssues(
  issues: QualityIssue[],
  params: { validacion: ValidacionPlano; analisis: AnalisisRFQ; presupuesto: PresupuestoRFQ },
  reasons: string[]
): void {
  for (const reason of reasons) {
    issues.push({
      categoria: categoryForReason(reason),
      severidad: severityForDeclaredReason(reason, params),
      campo: 'Aclaracion declarada',
      mensaje: reason,
    })
  }
}

function categoryForReason(reason: string): QualityCategory {
  const text = normalize(reason)
  if (/cantidad|unidades|lote/.test(text)) return 'Datos comerciales'
  if (/plazo|fecha|entrega/.test(text)) return 'Coste/plazo'
  if (/material|revision|escala|cajetin|plano/.test(text)) return 'Plano/cajetin'
  if (/acabado|rugosidad|tratamiento|recubrimiento/.test(text)) return 'Fabricacion'
  return 'Riesgos DFM'
}

function severityForDeclaredReason(
  reason: string,
  params: { validacion: ValidacionPlano; analisis: AnalisisRFQ; presupuesto: PresupuestoRFQ }
): QualitySeverity {
  const text = normalize(reason)
  if (params.validacion.resultado === 'NO_PROCESABLE') return 'CRITICO'
  if (/corrupt|ilegible|incompleto|no.*plano|sin.*plano|no.*2d/.test(text)) return 'CRITICO'
  if (/cantidad/.test(text) && !hasAnyPositiveQuantity(params.analisis.cantidades)) return 'CRITICO'
  if (/material.*no.*especificado|no.*material/.test(text) && params.analisis.piezas.every((pieza) => isMissing(pieza.material))) {
    return 'CRITICO'
  }
  if (/dimension|cota/.test(text) && params.analisis.piezas.every((pieza) => isMissing(pieza.dimensiones))) return 'CRITICO'
  return 'AVISO'
}

export function buildQualityMarkdown(report: QualityReport): string {
  return `# Quality Gate RFQ - ${report.ref_interna}

**Veredicto:** ${displayVerdict(report.veredicto)}  
**Score:** ${report.score_global}/100  
**Piezas:** ${report.piezas_total}  
**Revision humana:** obligatoria  
**Envio final a cliente:** bloqueado

## Resumen ejecutivo

${report.resumen_ejecutivo}

## Grupos de incidencias

${report.grupos.map((grupo) => `- **${grupo.categoria}** (${grupo.total}, ${grupo.severidad_maxima}): ${grupo.resumen}`).join('\n') || '- Sin incidencias agrupadas'}

## Piezas

${report.piezas.map((pieza) => `- **${pieza.pieza}**: ${pieza.score}/100 - ${displayVerdict(pieza.veredicto)} (${pieza.issues.length} incidencia(s))`).join('\n') || '- Sin piezas'}

## Preguntas sugeridas al cliente

${report.preguntas_cliente.map((pregunta) => `- ${pregunta}`).join('\n') || '- Sin preguntas sugeridas'}
`
}

export function displayVerdict(veredicto: QualityVerdict): string {
  if (veredicto === 'BORRADOR_INTERNO') return 'Borrador interno'
  if (veredicto === 'ACLARACIONES_NECESARIAS') return 'Necesita aclaraciones'
  return 'No procesable'
}

function addIf(
  issues: QualityIssue[],
  condition: boolean,
  categoria: QualityCategory,
  severidad: QualitySeverity,
  pieza: string,
  campo: string,
  mensaje: string
): void {
  if (condition) issues.push({ categoria, severidad, pieza, campo, mensaje })
}

function isMissing(value: string): boolean {
  return !value.trim() || /no especificado|sin fuente|no aplica|n\/d/i.test(value)
}

function hasQuantity(cantidades: Record<string, number>, pieza: string, pieceCount: number): boolean {
  if ((cantidades[pieza] ?? 0) > 0) return true
  const normalized = normalize(pieza)
  if (Object.entries(cantidades).some(([key, value]) => normalize(key) === normalized && value > 0)) return true
  return pieceCount === 1 && hasAnyPositiveQuantity(cantidades)
}

function hasAnyPositiveQuantity(cantidades: Record<string, number>): boolean {
  return Object.values(cantidades).some((value) => value > 0)
}

function isInferredQuantity(value: string): boolean {
  return /asum|infer|no hay indicacion|no especificad|por defecto/i.test(value)
}

function scoreFromIssues(issues: QualityIssue[]): number {
  return Math.max(0, 100 - severityPenalty(issues))
}

function severityPenalty(issues: QualityIssue[]): number {
  return issues.reduce((sum, issue) => sum + (issue.severidad === 'CRITICO' ? 20 : issue.severidad === 'AVISO' ? 8 : 2), 0)
}

function globalPenalty(issues: QualityIssue[]): number {
  const hasCritical = issues.some((issue) => issue.severidad === 'CRITICO')
  return Math.min(hasCritical ? 30 : 10, severityPenalty(uniqueIssues(issues)))
}

function verdictFromScore(score: number, issues: QualityIssue[]): QualityVerdict {
  if (issues.some((issue) => issue.campo === 'Validacion' && issue.severidad === 'CRITICO')) return 'NO_PROCESABLE'
  if (!issues.some((issue) => issue.severidad === 'CRITICO')) {
    if (score >= 85) return 'BORRADOR_INTERNO'
    return 'ACLARACIONES_NECESARIAS'
  }
  if (score < 35) return 'NO_PROCESABLE'
  if (issues.some((issue) => issue.severidad === 'CRITICO') || score < 70) return 'ACLARACIONES_NECESARIAS'
  if (score >= 85) return 'BORRADOR_INTERNO'
  return 'ACLARACIONES_NECESARIAS'
}

function groupIssues(issues: QualityIssue[]): QualityGroup[] {
  return categories
    .map((categoria) => {
      const items = issues.filter((issue) => issue.categoria === categoria)
      if (items.length === 0) return null
      const severity = items.some((issue) => issue.severidad === 'CRITICO') ? 'CRITICO' : items.some((issue) => issue.severidad === 'AVISO') ? 'AVISO' : 'INFO'
      return {
        categoria,
        severidad_maxima: severity as QualitySeverity,
        total: items.length,
        resumen: summarizeGroup(categoria, items),
        issues: items,
      }
    })
    .filter((group): group is QualityGroup => group !== null)
}

function summarizeGroup(categoria: QualityCategory, issues: QualityIssue[]): string {
  const piezas = unique(issues.map((issue) => issue.pieza).filter((value): value is string => Boolean(value)))
  const target = piezas.length ? `${piezas.length} pieza(s)` : 'RFQ general'
  return `${target} con ${issues.length} punto(s) a revisar en ${categoria.toLowerCase()}.`
}

function compareSeverity(a: QualityIssue, b: QualityIssue): number {
  const order: Record<QualitySeverity, number> = { CRITICO: 0, AVISO: 1, INFO: 2 }
  return order[a.severidad] - order[b.severidad]
}

function buildExecutiveSummary(veredicto: QualityVerdict, score: number, issueCount: number): string {
  if (veredicto === 'BORRADOR_INTERNO') return `RFQ util como borrador interno. Score ${score}/100 con ${issueCount} punto(s) menores a revisar.`
  if (veredicto === 'ACLARACIONES_NECESARIAS') return `RFQ util para preanalisis, pero necesita aclaraciones antes de enviar precio final. Score ${score}/100.`
  return `RFQ no procesable con seguridad. Score ${score}/100.`
}

function buildQuestions(issues: QualityIssue[]): string[] {
  const questions = issues
    .filter((issue) => issue.severidad !== 'INFO')
    .slice(0, 8)
    .map((issue) => {
      const pieza = issue.pieza ? ` para ${issue.pieza}` : ''
      return `Confirmar ${issue.campo.toLowerCase()}${pieza}: ${issue.mensaje}`
    })
  return unique(questions)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function uniqueIssues(issues: QualityIssue[]): QualityIssue[] {
  const seen = new Set<string>()
  return issues.filter((issue) => {
    const key = [issue.categoria, issue.severidad, issue.pieza ?? '', issue.campo, normalize(issue.mensaje)].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function average(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1))
}
