import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import puppeteer from 'puppeteer-core'
import type { AnalisisRFQ, ConfigTaller, PresupuestoRFQ } from '../types'

// Rutas habituales de Chrome/Chromium en Windows, macOS y Linux
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean)

function encontrarChrome(): string {
  const fromEnv = process.env.CHROME_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (found) return found
  throw new Error(
    'No se encontro Chrome/Chromium para generar el PDF. ' +
    'Instala Google Chrome o indica la ruta con CHROME_PATH en .env.local'
  )
}

export function buildPresupuestoHtml(presupuesto: PresupuestoRFQ, analisis: AnalisisRFQ, config: ConfigTaller): string {
  const rows = presupuesto.lineas
    .map(
      (linea) => `<tr>
        <td><strong>${escapeHtml(linea.denominacion)}</strong></td>
        <td class="num">${linea.cantidad}</td>
        <td>${escapeHtml(linea.operaciones)}</td>
        <td><span class="mat-tag">${escapeHtml(linea.desglose?.material_normalizado ?? 'N/D')}</span></td>
        <td class="num">${linea.pvp_unitario.toFixed(2)} EUR</td>
        <td class="num"><strong>${linea.subtotal.toFixed(2)} EUR</strong></td>
      </tr>`
    )
    .join('')

  const draftBanner = presupuesto.requires_human_review
    ? `<div class="draft-banner">BORRADOR — Requiere validacion humana antes del envio al cliente</div>`
    : ''

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Presupuesto ${escapeHtml(presupuesto.ref_interna)}</title>
  <style>
    @page { size: A4; margin: 18mm 18mm 22mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1f27; margin: 0; font-size: 12px; line-height: 1.5; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #1a1f27; margin-bottom: 20px; }
    .brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; color: #1a1f27; }
    .brand-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .doc-meta { text-align: right; }
    .doc-ref { font-size: 16px; font-weight: 700; color: #1a1f27; }
    .doc-date { font-size: 10px; color: #6b7280; margin-top: 2px; }

    /* Draft banner */
    .draft-banner { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; font-size: 10px; font-weight: 700; text-align: center; padding: 5px 12px; margin-bottom: 16px; letter-spacing: 0.05em; }

    /* Info boxes */
    .info-row { display: flex; gap: 12px; margin-bottom: 18px; }
    .info-box { flex: 1; background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 3px; padding: 10px 12px; }
    .info-box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 4px; }
    .info-box-value { font-size: 12px; font-weight: 600; color: #1a1f27; }
    .info-box-sub { font-size: 10px; color: #6b7280; }

    /* Section headers */
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #1a1f27; color: #fff; font-size: 10px; font-weight: 600; padding: 7px 8px; text-align: left; letter-spacing: 0.03em; }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #f8f9fb; }
    tbody tr:last-child td { border-bottom: 2px solid #1a1f27; }
    td { padding: 8px; font-size: 11px; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .mat-tag { display: inline-block; background: #e5e7eb; font-size: 9px; padding: 1px 5px; border-radius: 2px; color: #374151; }

    /* Totals */
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 14px; }
    .totals { width: 260px; border: 1px solid #e5e7eb; border-radius: 3px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 12px; font-size: 11px; border-bottom: 1px solid #e5e7eb; }
    .totals-row:last-child { border-bottom: none; background: #1a1f27; color: #fff; font-size: 13px; font-weight: 700; }
    .totals-label { color: inherit; }
    .totals-value { font-variant-numeric: tabular-nums; }

    /* Conditions */
    .cond-box { background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 3px; padding: 10px 12px; font-size: 11px; white-space: pre-wrap; color: #374151; }

    /* Footer */
    .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-sign { font-size: 10px; color: #6b7280; }
    .footer-sign-line { border-top: 1px solid #9ca3af; width: 160px; margin-top: 28px; margin-bottom: 3px; }
    .footer-legal { font-size: 9px; color: #9ca3af; max-width: 340px; text-align: right; }

    /* Watermark for draft */
    @media print {
      .draft-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .totals-row:last-child { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-name">${escapeHtml(config.nombre)}</div>
      <div class="brand-sub">CIF: ${escapeHtml(config.cif)} &nbsp;|&nbsp; ${escapeHtml(config.email)}</div>
    </div>
    <div class="doc-meta">
      <div class="doc-ref">${escapeHtml(presupuesto.ref_interna)}</div>
      <div class="doc-date">Fecha: ${escapeHtml(presupuesto.fecha)}</div>
      <div class="doc-date">Validez: ${presupuesto.validez_dias} dias</div>
    </div>
  </div>

  ${draftBanner}

  <div class="info-row">
    <div class="info-box">
      <div class="info-box-title">Cliente</div>
      <div class="info-box-value">${escapeHtml(analisis.cliente.empresa)}</div>
      <div class="info-box-sub">${escapeHtml(analisis.cliente.contacto)} &nbsp;|&nbsp; ${escapeHtml(analisis.cliente.email)}</div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Plazo solicitado</div>
      <div class="info-box-value">${escapeHtml(analisis.plazo_solicitado)}</div>
      <div class="info-box-sub">Entrega estimada: ${presupuesto.plazo_entrega_dias} dias laborables</div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Complejidad</div>
      <div class="info-box-value">${escapeHtml(analisis.complejidad_global)}</div>
      <div class="info-box-sub">${analisis.piezas.length} pieza(s) · ${analisis.tiempo_total_min} min estimados</div>
    </div>
  </div>

  <h2>Desglose de partidas</h2>
  <table>
    <thead>
      <tr>
        <th>Denominacion</th>
        <th class="num">Cant.</th>
        <th>Operaciones principales</th>
        <th>Material</th>
        <th class="num">Precio unit.</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Subtotal sin IVA</span>
        <span class="totals-value">${presupuesto.subtotal.toFixed(2)} EUR</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">IVA (21 %)</span>
        <span class="totals-value">${presupuesto.iva.toFixed(2)} EUR</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">TOTAL</span>
        <span class="totals-value">${presupuesto.total.toFixed(2)} EUR</span>
      </div>
    </div>
  </div>

  <h2>Condiciones comerciales</h2>
  <div class="cond-box">${escapeHtml(presupuesto.condiciones)}</div>

  <h2>Observaciones tecnicas</h2>
  <div class="cond-box">${escapeHtml(presupuesto.observaciones_tecnicas)}</div>

  <div class="footer">
    <div class="footer-sign">
      <div>Firma y sello del proveedor</div>
      <div class="footer-sign-line"></div>
      <div>${escapeHtml(config.nombre)}</div>
    </div>
    <div class="footer-legal">
      Documento generado por RFQ Agent. Los precios indicados son orientativos y estan sujetos a revision tecnica final. Este presupuesto no tiene validez contractual hasta la firma del pedido en firme.
    </div>
  </div>
</body>
</html>`
}

export async function writeHtmlAndPdf(htmlPath: string, pdfPath: string, html: string): Promise<void> {
  await mkdir(dirname(htmlPath), { recursive: true })
  await writeFile(htmlPath, html, 'utf8')

  const executablePath = encontrarChrome()
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true })
  } finally {
    await browser.close()
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
