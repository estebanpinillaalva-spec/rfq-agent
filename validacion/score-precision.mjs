#!/usr/bin/env node
// validacion/score-precision.mjs
//
// Compara la extracción real del agente (analisis.json) contra una verdad-terreno
// verificada por un humano, y produce una puntuación de precisión ponderada por pieza
// y global. Sin dependencias externas. Requiere Node 18+.
//
// Uso:
//   node validacion/score-precision.mjs <ruta-analisis.json> <ruta-verdad-terreno.json> [ruta-informe.md]
//
// Salida: resumen por stdout + informe markdown en validacion/reportes/.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEIGHTS = {
  material: 20,
  dimensiones: 15,
  tolerancias_criticas: 12,
  cantidad: 10,
  gdt: 8,
  acabado: 8,
  roscas: 6,
  agujeros: 6,
  tolerancias_generales: 4,
  tratamientos: 3,
  numero_plano: 3,
  recubrimientos: 2,
  denominacion: 2,
  revision_plano: 1,
}
const ARRAY_FIELDS = new Set(['tolerancias_criticas', 'gdt', 'roscas', 'agujeros', 'tratamientos', 'recubrimientos'])

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.,±øº°/x+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenSet(value) {
  return new Set(normalize(value).split(' ').filter(Boolean))
}

function f1(aSet, bSet) {
  if (aSet.size === 0 && bSet.size === 0) return 1
  if (aSet.size === 0 || bSet.size === 0) return 0
  let inter = 0
  for (const token of aSet) if (bSet.has(token)) inter++
  const precision = inter / bSet.size
  const recall = inter / aSet.size
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
}

function scalarScore(expected, got) {
  const e = normalize(expected)
  const g = normalize(got)
  if (!e) return null
  if (!g) return 0
  if (e === g) return 1
  if (g.includes(e) || e.includes(g)) return 0.9
  return f1(tokenSet(e), tokenSet(g))
}

function itemScore(expectedItem, gotItem) {
  const e = normalize(expectedItem)
  const g = normalize(gotItem)
  if (!e || !g) return 0
  if (e === g) return 1
  if (g.includes(e) || e.includes(g)) return 0.9
  return f1(tokenSet(e), tokenSet(g))
}

function arrayScore(expected, got) {
  const exp = (Array.isArray(expected) ? expected : []).map(String).filter((s) => s.trim() !== '')
  const gt = (Array.isArray(got) ? got : []).map(String).filter((s) => s.trim() !== '')
  if (exp.length === 0) return null
  if (gt.length === 0) return 0
  let sum = 0
  for (const item of exp) {
    let best = 0
    for (const candidate of gt) best = Math.max(best, itemScore(item, candidate))
    sum += best
  }
  return sum / exp.length
}

function cantidadScore(expected, cantidades) {
  if (cantidades == null || typeof cantidades !== 'object') return 0
  const values = Object.values(cantidades).map(Number).filter((n) => !Number.isNaN(n))
  return values.some((v) => v === Number(expected)) ? 1 : 0
}

function fmt(value) {
  if (Array.isArray(value)) return value.map(String).join(' · ') || '—'
  if (value == null || String(value).trim() === '') return '—'
  const s = String(value)
  return s.length > 80 ? s.slice(0, 77) + '…' : s
}

function findPieza(analisisPiezas, gtPieza, idx) {
  const np = normalize(gtPieza.numero_plano)
  if (np) {
    const byPlano = analisisPiezas.find((p) => normalize(p.numero_plano) === np)
    if (byPlano) return byPlano
  }
  const den = normalize(gtPieza.denominacion)
  if (den) {
    const byDen = analisisPiezas.find((p) => normalize(p.denominacion) === den)
    if (byDen) return byDen
  }
  return analisisPiezas[idx] ?? null
}

function verdict(score) {
  if (score >= 85) return 'OK — cumple la barra (≥85%). La tecnología sostiene el negocio.'
  if (score >= 70) return 'REVISAR — iterar prompts (skills/procesar-rfq) y config. Repetir.'
  return 'INSUFICIENTE — considerar extractor especializado (Werk24/LlamaParse) tras la misma interfaz.'
}

function scorePieza(gtPieza, aPieza, cantidades) {
  const rows = []
  let weightedSum = 0
  let weightTotal = 0
  for (const [field, weight] of Object.entries(WEIGHTS)) {
    if (field === 'cantidad') continue
    let match = null
    if (ARRAY_FIELDS.has(field)) {
      match = arrayScore(gtPieza[field], aPieza ? aPieza[field] : [])
    } else {
      match = scalarScore(gtPieza[field], aPieza ? aPieza[field] : '')
    }
    if (match === null) continue
    rows.push({ field, weight, match, expected: fmt(gtPieza[field]), got: fmt(aPieza ? aPieza[field] : '') })
    weightedSum += weight * match
    weightTotal += weight
  }
  if (gtPieza.cantidad != null && String(gtPieza.cantidad).trim() !== '') {
    const match = cantidadScore(gtPieza.cantidad, cantidades)
    rows.push({ field: 'cantidad', weight: WEIGHTS.cantidad, match, expected: String(gtPieza.cantidad), got: fmt(cantidades && Object.values(cantidades).join(' | ')) })
    weightedSum += WEIGHTS.cantidad * match
    weightTotal += WEIGHTS.cantidad
  }
  const score = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0
  return { rows, score, matched: Boolean(aPieza) }
}

function main() {
  const [, , analisisPath, verdadPath, informeArg] = process.argv
  if (!analisisPath || !verdadPath) {
    console.error('Uso: node validacion/score-precision.mjs <analisis.json> <verdad-terreno.json> [informe.md]')
    process.exit(1)
  }

  let analisis
  let verdad
  try {
    analisis = JSON.parse(readFileSync(resolve(analisisPath), 'utf8'))
  } catch (error) {
    console.error(`No pude leer/parsear analisis.json: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
  try {
    verdad = JSON.parse(readFileSync(resolve(verdadPath), 'utf8'))
  } catch (error) {
    console.error(`No pude leer/parsear verdad-terreno.json: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  // El salida/analisis.json envuelve el AnalisisRFQ en { validacion, analisis, presupuesto }.
  // Soportamos tanto ese formato como un AnalisisRFQ plano.
  const a = analisis && typeof analisis.analisis === 'object' && analisis.analisis !== null ? analisis.analisis : analisis
  const analisisPiezas = Array.isArray(a.piezas) ? a.piezas : []
  const cantidades = a.cantidades ?? {}
  const gtPiezas = Array.isArray(verdad.piezas) ? verdad.piezas : []

  if (gtPiezas.length === 0) {
    console.error('La verdad-terreno no tiene piezas. Rellena al menos una.')
    process.exit(1)
  }

  const piezaResults = gtPiezas.map((gt, idx) => {
    const aPieza = findPieza(analisisPiezas, gt, idx)
    return { gt, ...scorePieza(gt, aPieza, cantidades) }
  })

  const globalScore = piezaResults.reduce((sum, r) => sum + r.score, 0) / piezaResults.length

  // --- Informe markdown ---
  const fixture = verdad.fixture || 'sin-nombre'
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const lines = []
  lines.push(`# Informe de precisión — ${fixture}`)
  lines.push('')
  lines.push(`Fecha: ${new Date().toISOString()}`)
  lines.push(`Analisis: \`${analisisPath}\``)
  lines.push(`Verdad-terreno: \`${verdadPath}\``)
  lines.push('')
  lines.push(`## Precisión media ponderada: ${globalScore.toFixed(1)} %`)
  lines.push('')
  lines.push(`**Veredicto:** ${verdict(globalScore)}`)
  lines.push('')
  for (let i = 0; i < piezaResults.length; i++) {
    const r = piezaResults[i]
    lines.push(`### Pieza ${i + 1}: ${r.gt.denominacion || r.gt.numero_plano || '(sin nombre)'} — ${r.score.toFixed(1)} %`)
    if (!r.matched) lines.push('> ⚠️ No se encontró pieza correspondiente en analisis.json (comparada contra vacío).')
    lines.push('')
    lines.push('| Campo | Peso | Acierto | Verdad-terreno | Extraído |')
    lines.push('|---|---:|---:|---|---|')
    for (const row of r.rows) {
      lines.push(`| ${row.field} | ${row.weight} | ${(row.match * 100).toFixed(0)}% | ${row.expected} | ${row.got} |`)
    }
    lines.push('')
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const reportesDir = resolve(scriptDir, 'reportes')
  const outPath = informeArg ? resolve(informeArg) : resolve(reportesDir, `precision-${fixture}-${ts}.md`)
  try {
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, lines.join('\n'), 'utf8')
  } catch (error) {
    console.error(`Aviso: no pude escribir el informe: ${error instanceof Error ? error.message : String(error)}`)
  }

  // --- Resumen por stdout ---
  console.log('')
  console.log(`PRECISIÓN MEDIA PONDERADA: ${globalScore.toFixed(1)} %`)
  for (let i = 0; i < piezaResults.length; i++) {
    const r = piezaResults[i]
    console.log(`  Pieza ${i + 1} (${r.gt.denominacion || r.gt.numero_plano || '?'}): ${r.score.toFixed(1)} %${r.matched ? '' : ' [sin match]'}`)
  }
  console.log('')
  console.log(verdict(globalScore))
  console.log(`Informe: ${outPath}`)
}

main()
