import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

async function main(): Promise<void> {
  const fixturesDir = resolve('fixtures', 'reales-anonimizados')
  const names = await readdir(fixturesDir).catch(() => [])
  const cases = names.filter((name) => !name.startsWith('.') && name !== '.gitkeep')

  const provider = process.env.RFQ_BENCHMARK_PROVIDER ?? 'mock'
  const lines: string[] = [
    '# Reporte de validacion RFQ',
    '',
    `Fecha: ${new Date().toISOString()}`,
    `Proveedor benchmark: ${provider}`,
    '',
    'Por defecto este benchmark usa `mock` para no gastar cuota. Define `RFQ_BENCHMARK_PROVIDER=gemini` solo para validaciones puntuales.',
    '',
  ]

  if (cases.length === 0) {
    lines.push('No hay fixtures reales anonimizados todavia.')
    lines.push('')
    lines.push('Crea carpetas en `fixtures/reales-anonimizados/rfq-001/` con `email.txt`, `config-taller.json` y planos.')
  }

  for (const name of cases) {
    const casePath = join(fixturesDir, name)
    const before = await listSalidaDirs()
    const start = Date.now()
    const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', casePath], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, RFQ_AI_PROVIDER: provider },
    })
    const durationMs = Date.now() - start
    const salida = await findNewSalida(before)
    const quality = salida ? await readQualityReport(salida) : null
    const ok = result.status === 0
    lines.push(`## ${name}`)
    lines.push(`- Estado tecnico: ${ok ? 'OK' : 'ERROR_RECUPERABLE'}`)
    lines.push(`- Duracion: ${durationMs} ms`)
    lines.push(`- Salida: ${salida ?? 'No detectada'}`)
    lines.push(`- Quality Gate: ${quality ? `${quality.score}/100 - ${quality.verdict} (${quality.issues} aclaraciones)` : 'No generado'}`)
    if (!ok) lines.push(`- Error: ${(result.stderr || result.stdout).split(/\r?\n/).slice(-5).join(' ')}`)
    lines.push('')
  }

  await writeFile('reporte-validacion.md', lines.join('\n'), 'utf8')
  console.log('Reporte generado: reporte-validacion.md')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
})

async function listSalidaDirs(): Promise<string[]> {
  const entries = await readdir(resolve('salidas'), { withFileTypes: true }).catch(() => [])
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

async function findNewSalida(before: string[]): Promise<string | null> {
  const previous = new Set(before)
  const after = await listSalidaDirs()
  const created = after.filter((name) => !previous.has(name)).sort().reverse()
  return created[0] ?? null
}

async function readQualityReport(salida: string): Promise<{ score: number; verdict: string; issues: number } | null> {
  const text = await readFile(join(resolve('salidas'), salida, 'quality-report.json'), 'utf8').catch(() => '')
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as unknown
    const record = asRecord(parsed)
    const groups = Array.isArray(record?.grupos) ? record.grupos : []
    return {
      score: typeof record?.score_global === 'number' ? record.score_global : 0,
      verdict: typeof record?.veredicto === 'string' ? record.veredicto : 'SIN_VEREDICTO',
      issues: groups.reduce((sum, group) => {
        const total = asRecord(group)?.total
        return sum + (typeof total === 'number' ? total : 0)
      }, 0),
    }
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}
