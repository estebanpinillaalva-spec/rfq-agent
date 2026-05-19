import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { buildPresupuestoHtml, writeHtmlAndPdf } from '../utils/renderPdf'
import { buildEmailRespuesta } from '../utils/guardarSalida'
import type { AnalisisRFQ, ConfigTaller, PresupuestoRFQ } from '../types'

const PILOT_ROOT = resolve(process.cwd())

function parseArgs(argv: string[]): { dir: string } {
  const i = argv.indexOf('--dir')
  if (i < 0 || !argv[i + 1]) {
    throw new Error('Uso: tsx src/scripts/regenerarSalida.ts --dir <ruta-salida-rfq>')
  }
  return { dir: resolve(argv[i + 1]) }
}

async function loadConfig(dir: string): Promise<ConfigTaller> {
  const local = join(dir, 'config-taller.json')
  if (existsSync(local)) {
    return JSON.parse(await readFile(local, 'utf8')) as ConfigTaller
  }
  const fallback = resolve(PILOT_ROOT, 'ejemplos', 'rfq-simple', 'config-taller.json')
  return JSON.parse(await readFile(fallback, 'utf8')) as ConfigTaller
}

async function main() {
  const { dir } = parseArgs(process.argv.slice(2))
  const analisisPath = join(dir, 'analisis.json')
  const raw = await readFile(analisisPath, 'utf8')
  const data = JSON.parse(raw) as { analisis: AnalisisRFQ; presupuesto: PresupuestoRFQ }
  if (!data.presupuesto || !data.analisis) {
    throw new Error('analisis.json no contiene { analisis, presupuesto }')
  }

  const config = await loadConfig(dir)

  const htmlPath = join(dir, 'presupuesto.html')
  const pdfPath = join(dir, 'presupuesto.pdf')
  const emailPath = join(dir, 'email-respuesta.md')

  const html = buildPresupuestoHtml(data.presupuesto, data.analisis, config)
  await writeHtmlAndPdf(htmlPath, pdfPath, html)
  await writeFile(emailPath, buildEmailRespuesta(data.analisis, data.presupuesto, config), 'utf8')

  process.stdout.write(
    JSON.stringify({
      ok: true,
      pdfPath,
      emailPath,
      total: data.presupuesto.total,
      regeneratedAt: new Date().toISOString(),
    }) + '\n'
  )
}

main().catch((err) => {
  process.stderr.write(`[regenerarSalida] ${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})
